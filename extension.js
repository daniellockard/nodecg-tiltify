"use strict";
const fetch = require('node-fetch')
let crypto;
let WEBHOOK_MODE = true

try {
  crypto = require('node:crypto');
} catch (err) {
  nodecg.log.error('ERROR: crypto support is disabled! webhook message authenticity cannot be validated. try a newer node version.');
  WEBHOOK_MODE = false;
}

module.exports = function (nodecg) {
  const app = nodecg.Router();

  var donationsRep = nodecg.Replicant("donations", {
    defaultValue: [],
  });
  var allDonationsRep = nodecg.Replicant("alldonations", {
    defaultValue: [],
  });
  var campaignTotalRep = nodecg.Replicant("total", {
    defaultValue: 0,
  });
  var pollsRep = nodecg.Replicant("donationpolls", {
    defaultValue: [],
  });
  var scheduleRep = nodecg.Replicant("schedule", {
    defaultValue: [],
  });
  var targetsRep = nodecg.Replicant("targets", {
    defaultValue: [],
  });
  var rewardsRep = nodecg.Replicant("rewards", {
    defaultValue: [],
  });
  var accountRep = nodecg.Replicant("account", {
    defaultValue: {}
  })

  var TiltifyClient = require("tiltify-api-client");
  
  function isEmpty(string) {
    return string === undefined || string === null || string === ""
  }

  if (isEmpty(nodecg.bundleConfig.tiltify_webhook_secret) || isEmpty(nodecg.bundleConfig.tiltify_webhook_id)|| isEmpty(nodecg.bundleConfig.tiltify_redirect_uri)) {
    WEBHOOK_MODE = false
    nodecg.log.info("Running without webhooks!! Please set redirect uri, webhook secret, and webhook id in cfg/nodecg-tiltify.json [See README]");
    return;
  }

  if (isEmpty(nodecg.bundleConfig.tiltify_client_id)) {
    nodecg.log.info("Please set tiltify_client_id in cfg/nodecg-tiltify.json");
    return;
  }

  if (isEmpty(nodecg.bundleConfig.tiltify_client_secret)) {
    nodecg.log.info("Please set tiltify_client_secret in cfg/nodecg-tiltify.json");
    return;
  }

  if (isEmpty(nodecg.bundleConfig.tiltify_campaign_id)) {
    nodecg.log.info(
      "Please set tiltify_campaign_id in cfg/nodecg-tiltify.json"
    );
    return;
  }

  var client = new TiltifyClient(nodecg.bundleConfig.tiltify_client_id, nodecg.bundleConfig.tiltify_client_secret);

  function pushUniqueDonation(donation) {
    var found = donationsRep.value.find(function (element) {
      return element.id === donation.id;
    });
    if (found === undefined) {
      donation.shown = false;
      donation.read = false;
      donationsRep.value.push(donation);
    }
  }

  function updateTotal(campaign) {
    // Less than check in case webhooks are sent out-of-order. Only update the total if it's higher!
    if (campaignTotalRep.value < parseFloat(campaign.amount_raised.value)
    ) {
      campaignTotalRep.value = parseFloat(campaign.amount_raised.value);
    }
  }

  /**
   * Checks that the key is not expired, and if so, regenerates the key
   * @returns {string} access key
   */
  async function checkKey() {
    // Not signed in
    if (!accountRep.value || accountRep.value == {} || !accountRep.value.refresh_token) {
      return false
    }
    // If not expired else renew
    if (new Date(accountRep.value.expires).getTime() > new Date().getTime()) {
      return accountRep.value.access_token
    } else {
      let keys
      try {
        console.log(`https://v5api.tiltify.com/oauth/token`
        + `?client_id=${nodecg.bundleConfig.tiltify_client_id}`
        + `&client_secret=${nodecg.bundleConfig.tiltify_client_secret}`
        + `&grant_type=refresh_token`
        + `&code=${accountRep.value.refresh_token}`
        + `&redirect_uri=${nodecg.bundleConfig.tiltify_redirect_uri}`
        + `&scope=public webhooks:write`)
        console.log(accountRep.value)
        keys = await fetch(`https://v5api.tiltify.com/oauth/token`
              + `?client_id=${nodecg.bundleConfig.tiltify_client_id}`
              + `&client_secret=${nodecg.bundleConfig.tiltify_client_secret}`
              + `&grant_type=refresh_token`
              + `&code=${accountRep.value.refresh_token}`
              + `&redirect_uri=${nodecg.bundleConfig.tiltify_redirect_uri}`
              + `&scope=public webhooks:write`
            , {
          method: 'POST'
        })
        keys = await keys.json()
      } catch (e) {
        nodecg.log.error('nodecg-tiltify failed to refresh keys\n', e)
      }
      console.log(keys)
      if (keys.access_token) {
        const expires = new Date(new Date(keys.created_at).getTime() + keys.expires_in * 1000)
        accountRep.value = {
          access_token: keys.access_token,
          refresh_token: keys.refresh_token ?? accountRep.value.refresh_token,
          expires
        }
        return keys.access_token
      } else {
        nodecg.log.error("Failed to obtain keys when refreshing tokens")
        return false
      }
    }
  }

  /**
   * Verifies that the payload delivered matches the signature provided, using sha256 algorithm and the webhook secret
   * Acts as middleware, use in route chain
   */
  function validateSignature(req, res, next) {
    const signatureIn = req.get('X-Tiltify-Signature')
    const timestamp = req.get('X-Tiltify-Timestamp')
    const signedPayload = `${timestamp}.${JSON.stringify(req.body)}`
    const hmac = crypto.createHmac('sha256', nodecg.bundleConfig.tiltify_webhook_secret);
    hmac.update(signedPayload);
    const signature = hmac.digest('base64');
    if (signatureIn === signature) {
      next()
    } else {
      // Close connection (200 code MUST be sent regardless)
      res.sendStatus(200)
    };
  }

  /**
   * Activates the webhook and subscribes to donation and campaign total updates
   */
  async function activateWebhook() {
    const key = await checkKey()
    if (key) {
      const webhook = await fetch(`https://v5api.tiltify.com/api/private/webhook_endpoints/${nodecg.bundleConfig.tiltify_webhook_id}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`
        }
      })
      if (!webhook.ok) {
        nodecg.log.error('Webhook activation failed', webhook.statusText)
      }
      // TODO: When tiltify fixes it, change enpdoints back to endpoints
      const webhook_subscribe = await fetch(`https://v5api.tiltify.com/api/private/webhook_enpdoints/${nodecg.bundleConfig.tiltify_webhook_id}/webhook_subscriptions/${nodecg.bundleConfig.tiltify_campaign_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({event_types: ['public:direct:fact_updated', 'public:direct:donation_updated']})
      })
      if (!webhook_subscribe.ok) {
        nodecg.log.error('Webhook Subscription failed', webhook_subscribe.statusText)
      }
    }
  }

  app.get('/nodecg-tiltify/regenerate', (req, res) => {
    activateWebhook()
    res.send("Regenerated").end()
  })

  app.get('/nodecg-tiltify/logout', (req, res) => {
    accountRep.value = {}
    res.send("Logged Out").end()
  })

  app.get('/nodecg-tiltify/login', (req, res) => {
    res.redirect(302, `https://v5api.tiltify.com/oauth/authorize?client_id=${nodecg.bundleConfig.tiltify_client_id}&redirect_uri=${nodecg.bundleConfig.tiltify_redirect_uri}&response_type=code&scope=public webhooks:write`)
  })

  app.get(`/nodecg-tiltify/callback`, async (req, res) => {
    let keys
    try {
      keys = await fetch(`https://v5api.tiltify.com/oauth/token`
            + `?client_id=${nodecg.bundleConfig.tiltify_client_id}`
            + `&client_secret=${nodecg.bundleConfig.tiltify_client_secret}`
            + `&grant_type=authorization_code`
            + `&code=${req.query.code}`
            + `&redirect_uri=${nodecg.bundleConfig.tiltify_redirect_uri}`
            + `&scope=public webhooks:write`
          , {
        method: 'POST'
      })
      keys = await keys.json()
    } catch (e) {
      nodecg.log.error("nodecg-tiltify failed to create keys\n", e)
    }
    if (keys.access_token) {
      const expires = new Date(new Date(keys.created_at).getTime() + keys.expires_in * 1000)
      accountRep.value = {
        access_token: keys.access_token,
        refresh_token: keys.refresh_token,
        expires
      }
      activateWebhook()
      res.send("Logged in, close this tab").end()
    } else {
      nodecg.log.error("Failed to obtain keys when signing into tiltify")
      res.send("Login failed").end()
    }
  })

  app.post('/nodecg-tiltify/webhook', validateSignature, (req, res) => {
    console.log('Webhook in',req.body.meta.event_type)
    // Verify this webhook is sending out stuff for the campaign we're working on
    if (
      req.body.meta.event_type === "public:direct:donation_updated" &&
      req.body.data.campaign_id === nodecg.bundleConfig.tiltify_campaign_id
    ) {
      // New donation
      pushUniqueDonation(req.body.data)
    } else if (
      req.body.meta.event_type === "public:direct:fact_updated" &&
      req.body.data.id === nodecg.bundleConfig.tiltify_campaign_id
    ) {
      // Updated amount raised
      updateTotal(req.body.data)
    }
    // Send ack
    res.sendStatus(200)
  })

  async function askTiltifyForDonations() {
    client.Campaigns.getRecentDonations(
      nodecg.bundleConfig.tiltify_campaign_id,
      function (donations) {
        for (let i = 0; i < donations.length; i++) {
          pushUniqueDonation(donations[i])
        }
      }
    );
  }

  async function askTiltifyForAllDonations() {
    client.Campaigns.getDonations(
      nodecg.bundleConfig.tiltify_campaign_id,
      function (alldonations) {
        if (
          JSON.stringify(allDonationsRep.value) !== JSON.stringify(alldonations)
        ) {
          allDonationsRep.value = alldonations;
        }
      }
    );
  }

  async function askTiltifyForPolls() {
    client.Campaigns.getPolls(
      nodecg.bundleConfig.tiltify_campaign_id,
      function (polls) {
        if (JSON.stringify(pollsRep.value) !== JSON.stringify(polls)) {
          pollsRep.value = polls;
        }
      }
    );
  }

  async function askTiltifyForSchedule() {
    client.Campaigns.getSchedule(
      nodecg.bundleConfig.tiltify_campaign_id,
      function (schedule) {
        if (JSON.stringify(scheduleRep.value) !== JSON.stringify(schedule)) {
          scheduleRep.value = schedule;
        }
      }
    );
  }

  async function askTiltifyForTargets() {
    client.Campaigns.getTargets(
      nodecg.bundleConfig.tiltify_campaign_id,
      function (targets) {
        if (
          JSON.stringify(targetsRep.value) !== JSON.stringify(targets)
        ) {
          targetsRep.value = targets;
        }
      }
    );
  }

  async function askTiltifyForRewards() {
    client.Campaigns.getRewards(
      nodecg.bundleConfig.tiltify_campaign_id,
      function (rewards) {
        if (JSON.stringify(rewardsRep.value) !== JSON.stringify(rewards)) {
          rewardsRep.value = rewards;
        }
      }
    );
  }

  async function askTiltifyForTotal() {
    client.Campaigns.get(nodecg.bundleConfig.tiltify_campaign_id, function (
      campaign
    ) {
      updateTotal(campaign)
    });
  }

  function askTiltify() {
    // Donations and total are handled by websocket normally, only ask if not using websockets
    if (!WEBHOOK_MODE) {
      askTiltifyForDonations();
      askTiltifyForTotal();
    }
    askTiltifyForPolls();
    askTiltifyForTargets();
    askTiltifyForSchedule();
    askTiltifyForRewards();
  }

  client.initialize().then(()=>{
    askTiltifyForTotal();
    askTiltify();
    askTiltifyForAllDonations();

    setInterval(function () {
      askTiltify();
    }, WEBHOOK_MODE ? 120000 : 5000);
  
    setInterval(function () {
      askTiltifyForAllDonations();
    }, 5 * 60000);
  })

  nodecg.listenFor("clear-donations", (value, ack) => {
    for (let i = 0; i < donationsRep.value.length; i++) {
      donationsRep.value[i].read = true;
    }

    if (ack && !ack.handled) {
      ack(null, value);
    }
  });

  nodecg.listenFor("mark-donation-as-read", (value, ack) => {
    nodecg.log.info("Mark read", value.id)
    var isElement = (element) => element.id === value.id;
    var elementIndex = donationsRep.value.findIndex(isElement);
    if (elementIndex !== -1) {
      nodecg.log.info("Found", elementIndex, donationsRep.value[elementIndex])
      donationsRep.value[elementIndex].read = true;
      if (ack && !ack.handled) {
        ack(null, null);
      }
    } else {
      if (ack && !ack.handled) {
        ack(new Error("Donation not found to mark as read"), null);
      }
    }
  });

  nodecg.listenFor("mark-donation-as-shown", (value, ack) => {
    var isElement = (element) => element.id === value.id;
    var elementIndex = donationsRep.value.findIndex(isElement);
    if (elementIndex !== -1) {
      donationsRep.value[elementIndex].shown = true;
      if (ack && !ack.handled) {
        ack(null, null);
      }
    } else {
      if (ack && !ack.handled) {
        ack(new Error("Donation not found to mark as read"), null);
      }
    }
  });

  // On initalization if account has been logged in previously, activate webhooks
  if (accountRep.value !== {} && nodecg.bundleConfig.tiltify_webhook_id) {
    activateWebhook()
  }

  nodecg.mount(app);

};
