'use strict'

module.exports = function (nodecg) {
  var donationsRep = nodecg.Replicant('donations', {
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
    nodecg.log.info('Please set Tiltify API key in cfg/tiltify-api.json')
    return
  }

  if (nodecg.bundleConfig.tiltify_campaign_id === '') {
    nodecg.log.info('Please set Tiltify campaign ID in cfg/tiltify-api.json')
    return
  }

  var client = new TiltifyClient(nodecg.bundleConfig.tiltify_api_key)

  async function askTiltifyForDonations () {
    let donations = client.Campaigns.getRecentDonations(nodecg.bundleConfig.tiltify_campaign_id)
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
  }

  async function askTiltifyForPolls () {
    pollsRep.value = client.Campaigns.getPolls(nodecg.bundleConfig.tiltify_campaign_id)
  }

  async function askTiltifyForSchedule () {
    scheduleRep.value = client.Campaigns.getSchedule(nodecg.bundleConfig.tiltify_campaign_id)
  }

  async function askTiltifyForChallenges () {
    challengesRep.value = client.Campaigns.getChallenges(nodecg.bundleConfig.tiltify_campaign_id)
  }

  async function askTiltifyForRewards () {
    rewardsRep.value = client.Campaigns.getRewards(nodecg.bundleConfig.tiltify_campaign_id)
  }

  async function askTiltifyForTotal () {
    let campaign = client.Campaigns.get(nodecg.bundleConfig.tiltify_campaign_id)
    campaignTotalRep.value = parseFloat(campaign.amountRaised)
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

  askTiltify()
}
