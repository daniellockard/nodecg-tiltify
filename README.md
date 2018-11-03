tiltify-api is a [NodeCG](http://github.com/nodecg/nodecg) bundle. 
It works with NodeCG versions which satisfy this [semver](https://docs.npmjs.com/getting-started/semantic-versioning) range: `^1.1.1`
You will need to have an appropriate version of NodeCG installed to use it.


This bundle sets up a Replicant in the `tiltify-api` namespace, called
`donations`.  It contains all of the donations that we've seen from the Tiltify
API. It does NOT use pagination to get donations past the current "page".
It also exposes a Replicant called `total` in the same namespace that shows how
much Tiltify says we've raised so far!

You need to set up the config in `cfg/tiltify-api.json` to look something like
this:
```
{
	"tiltify_api_key": "KEY_HERE",
	"tiltify_campaign_id": "CAMPAIGN_HERE"
}
```

