'use strict'

module.exports = function (nodecg) {
  var donationsRep = nodecg.Replicant('donations', {
    defaultValue: []
  })
  var allDonationsRep = nodecg.Replicant('alldonations', {
    defaultValue: []
  })
  var campaignTotalRep = nodecg.Replicant('total', {
    defaultValue: 0
  })
  var pollsRep = nodecg.Replicant('donationpolls', {
    defaultValue: []
  })
  var scheduleRep = nodecg.Replicant('schedule', {
    defaultValue: []
  })
  var challengesRep = nodecg.Replicant('challenges', {
    defaultValue: []
  })
  var rewardsRep = nodecg.Replicant('rewards', {
    defaultValue: []
  })

  var TiltifyClient = require('tiltify-api-client')

  if (nodecg.bundleConfig.tiltify_api_key === '') {
    nodecg.log.info('Please set tiltify_api_key in cfg/nodecg-tiltify.json')
    return
  }

  if (nodecg.bundleConfig.tiltify_campaign_id === '') {
    nodecg.log.info('Please set tiltify_campaign_id in cfg/nodecg-tiltify.json')
    return
  }

  var client = new TiltifyClient(nodecg.bundleConfig.tiltify_api_key)

  async function askTiltifyForDonations () {
    client.Campaigns.getRecentDonations(nodecg.bundleConfig.tiltify_campaign_id, function (donations) {
      for (let i = 0; i < donations.length; i++) {
        var found = donationsRep.value.find(function (element) {
          return element.id === donations[i].id
        })
        if (found === undefined) {
          donations[i].shown = false
          donations[i].read = false
          donationsRep.value.push(donations[i])
        }
      }
    })
  }

  async function askTiltifyForAllDonations () {
    client.Campaigns.getDonations(nodecg.bundleConfig.tiltify_campaign_id, function (alldonations) {
      if (JSON.stringify(allDonationsRep.value) !== JSON.stringify(alldonations)) {
        allDonationsRep.value = alldonations
      }
    })
  }

  async function askTiltifyForPolls () {
    client.Campaigns.getPolls(nodecg.bundleConfig.tiltify_campaign_id, function (polls) {
      if (JSON.stringify(pollsRep.value) !== JSON.stringify(polls)) {
        pollsRep.value = polls
      }
    })
  }

  async function askTiltifyForSchedule () {
    client.Campaigns.getSchedule(nodecg.bundleConfig.tiltify_campaign_id, function (schedule) {
      if (JSON.stringify(scheduleRep.value) !== JSON.stringify(schedule)) {
        scheduleRep.value = schedule
      }
    })
  }

  async function askTiltifyForChallenges () {
    client.Campaigns.getChallenges(nodecg.bundleConfig.tiltify_campaign_id, function (challenges) {
      if (JSON.stringify(challengesRep.value) !== JSON.stringify(challenges)) {
        challengesRep.value = challenges
      }
    })
  }

  async function askTiltifyForRewards () {
    client.Campaigns.getRewards(nodecg.bundleConfig.tiltify_campaign_id, function (rewards) {
      if (JSON.stringify(rewardsRep.value) !== JSON.stringify(rewards)) {
        rewardsRep.value = rewards
      }
    })
  }

  async function askTiltifyForTotal () {
    client.Campaigns.get(nodecg.bundleConfig.tiltify_campaign_id, function (campaign) {
      if (campaignTotalRep.value !== parseFloat(campaign.amountRaised)) {
        campaignTotalRep.value = parseFloat(campaign.amountRaised)
      }
    })
  }

  function askTiltify () {
    askTiltifyForDonations()
    askTiltifyForPolls()
    askTiltifyForTotal()
    askTiltifyForChallenges()
    askTiltifyForSchedule()
    askTiltifyForRewards()
  }

  setInterval(function () {
    askTiltify()
  }, 5000)

  setInterval(function() {
    askTiltifyForAllDonations()
  }, 10000)

  askTiltify()
  askTiltifyForAllDonations()

  const router = nodecg.Router();

  router.post('/markallread', (req, res) => {
    for (let i = 0; i < donationsRep.value.length; i++) {
      donationsRep.value[i].read = true;
    }
    res.send('{"message": "All donations marked as read"}');
  });

  nodecg.mount('/nodecg-tiltify', router);
}
