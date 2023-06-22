$(document).ready(function () {
    function isEmpty(string) {
        return string === undefined || string === null || string === ""
    }

    if (isEmpty(nodecg.bundleConfig.tiltify_webhook_secret) || isEmpty(nodecg.bundleConfig.tiltify_webhook_id) || isEmpty(nodecg.bundleConfig.tiltify_redirect_uri)) {
        $('#webhook').text('Webhooks are disabled. Add required fields in config and restart nodecg to use this feature. See README')
        $('#else').hide()
    }

    let accountReplicant = nodecg.Replicant("account");
    NodeCG.waitForReplicants(accountReplicant).then(() => {
        if (accountReplicant.value && accountReplicant.value.access_token) {
            $('#status').text('LOGGED IN')
            $('#login').hide()
            $('#logout').show()
            $('#regenerate').show()
        } else {
            $('#status').text('LOGGED OUT')
            $('#logout').hide()
            $('#regenerate').hide()
            $('#login').show()
        }
        accountReplicant.on('change', (nVal, oVal) => {
            if (nVal && nVal.access_token) {
                $('#status').text('LOGGED IN')
                $('#login').hide()
                $('#logout').show()
                $('#regenerate').show()
            } else {
                $('#status').text('LOGGED OUT')
                $('#logout').hide()
                $('#regenerate').hide()
                $('#login').show()
            }
        })
    })
});
