'use strict';

module.exports = function (nodecg) {
	var WebRequest = require("web-request");
	var donationsRep = nodecg.Replicant("donations", {
		defaultValue: []
	});
	var campaignTotalRep = nodecg.Replicant("total");
	var pollsRep = nodecg.Replicant("donationpolls", {
		defaultValue: []
	});
	var defaultURL = "https://tiltify.com/api/v3"


	if (nodecg.bundleConfig.tiltify_api_key == "") {
		nodecg.log.info("Please set Tiltify API key in cfg/tiltify-api.json");
		return;
	}

	if (nodecg.bundleConfig.tiltify_campaign_id == "") {
		nodecg.log.info("Please set Tiltify campaign ID in cfg/tiltify-api.json");
		return;
	}

	async function askTiltifyForDonations() {
		var donationsRequest = await WebRequest.get(`${defaultURL}/campaigns/${nodecg.bundleConfig.tiltify_campaign_id}/donations`, {
			headers: {
				"Authorization": "Bearer " + nodecg.bundleConfig.tiltify_api_key
			}
		});

		processDonations(donationsRequest.content);
	}

	async function askTiltifyForPolls() {
		let pollsRequest = await WebRequest.get(`${defaultURL}/campaigns/${nodecg.bundleConfig.tiltify_campaign_id}/polls`, {
			headers: {
				"Authorization": "Bearer " + nodecg.bundleConfig.tiltify_api_key
			}
		});

		processPolls(pollsRequest.content);
	}

	async function askTiltifyForTotal() {
		var donationTotalRequest = await WebRequest.get(`${defaultURL}/campaigns/${nodecg.bundleConfig.tiltify_campaign_id}`, {
			headers: {
				"Authorization": "Bearer " + nodecg.bundleConfig.tiltify_api_key
			}
		});

		processTotal(donationTotalRequest.content);
	}

	function processTotal(content) {
		var parsedContent = JSON.parse(content);
		campaignTotalRep.value = parsedContent.data.amountRaised;
	}

	function processDonations(content) {
		var parsedContent = JSON.parse(content);
		var donations = parsedContent.data;
		for (let i = 0; i < donations.length; i++) {
			var found = donationsRep.value.find(function (element) {
				return element.id == donations[i].id
			});
			if (found == undefined) {
				donations[i].shown = false;
				donations[i].read = false;
				donationsRep.value.push(donations[i]);
			}
		}
	}

	function processPolls(content) {
		var parsedContent = JSON.parse(content);
		var polls = parsedContent.data;
		pollsRep.value = polls;
	}

	function askTiltify() {
		askTiltifyForDonations();
		askTiltifyForPolls();
		askTiltifyForTotal();
	}

	setInterval(function () {
		askTiltify();
	}, 5000);

	askTiltify();
};
