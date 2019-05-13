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

  async function askTiltifyForPolls () {
    client.Campaigns.getPolls(nodecg.bundleConfig.tiltify_campaign_id, function (polls) {
      if (pollsRep.vale !== polls) {
        pollsRep.value = polls
      }
    })
  }

  async function askTiltifyForSchedule () {
    client.Campaigns.getSchedule(nodecg.bundleConfig.tiltify_campaign_id, function (schedule) {
      if (scheduleRep.value !== schedule) {
        scheduleRep.value = schedule
      }
    })
  }

  async function askTiltifyForChallenges () {
    client.Campaigns.getChallenges(nodecg.bundleConfig.tiltify_campaign_id, function (challenges) {
      if (challengesRep.value !== challenges) {
        challengesRep.value = challenges
      }
    })
  }

  async function askTiltifyForRewards () {
    client.Campaigns.getRewards(nodecg.bundleConfig.tiltify_campaign_id, function (rewards) {
      if (rewardsRep.value !== rewards) {
        rewardsRep.value = rewards
      }
    })
  }

  async function askTiltifyForTotal () {
    client.Campaigns.get(nodecg.bundleConfig.tiltify_campaign_id, function (campaign) {
      if (campaignTotalRep !== parseFloat(campaign.amountRaised)) {
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

  askTiltify()
}
