'use strict';

module.exports = function (nodecg) {
	var WebRequest = require("web-request");
	var donationsRep = nodecg.Replicant("donations");
	var campaignTotalRep = nodecg.Replicant("total");


	if (nodecg.bundleConfig.tiltify_api_key == "") {
		nodecg.log.info("Please set Tiltify API key in cfg/tiltify-api.json");
		return;
	}
	if (nodecg.bundleConfig.tiltify_campaign_id == "") {
        nodecg.log.info("Please set Tiltify campaign ID in cfg/tiltify-api.json");
        return;
	}


	async function askTiltifyForDonations(){
		var donationsRequest = await WebRequest.get(`https://tiltify.com/api/v3/campaigns/${nodecg.bundleConfig.tiltify_campaign_id}/donations`, { headers: { "Authorization": "Bearer " + nodecg.bundleConfig.tiltify_api_key }});

		processDonations(donationsRequest.content);
	}

	async function askTiltifyForTotal(){
		var donationTotalRequest = await WebRequest.get(`https://tiltify.com/api/v3/campaigns/${nodecg.bundleConfig.tiltify_campaign_id}`,     {headers: { "Authorization": "Bearer " + nodecg.bundleConfig.tiltify_api_key }});

		processTotal(donationTotalRequest.content);
	}

	function processTotal(content) {
		var parsedContent = JSON.parse(content);
		campaignTotalRep.value = parsedContent.data.amountRaised;
	}

	function processDonations(content) {
		var parsedContent = JSON.parse(content);
		var donations = parsedContent.data;
		for(let i = 0; i < donations.length; i++) {
			var found = donationsRep.value.find(function(element) {
				return element.id == donations[i].id
			});
			if (found == undefined){
				donations[i].shown = false;
				donations[i].read = false;
				donationsRep.value.push(donations[i]);
				nodecg.sendMessage("donation", donations[i]);
			}
		}
	}

	setInterval(function(){
		askTiltifyForDonations();
		askTiltifyForTotal();
	}, 5000);

};
