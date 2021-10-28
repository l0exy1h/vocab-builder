// const fetch = require('node-fetch')
const cryptor = require('crypto')

// get access token for the service account
// credits to https://tanaikech.github.io/2019/04/02/retrieving-access-token-using-service-account-for-node.js-without-using-googleapis/
async function get_access_token() {
  const privateKey = 'REDACTED'
  const clientEmail = 'REDACTED'
  const scopes = ['REDACTED']
  const url = "REDACTED";
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: clientEmail,
    scope: scopes.join(" "),
    aud: url,
    exp: (now + 3600).toString(),
    iat: now.toString(),
  };
  const signature = Buffer.from(JSON.stringify(header)).toString('base64') + "." + Buffer.from(JSON.stringify(claim)).toString('base64');

  var sign = cryptor.createSign('RSA-SHA256');
  sign.update(signature);
  const jwt = signature + "." + sign.sign(privateKey, 'base64');
  const res = await fetch(url, {
    method: 'post',
    body: JSON.stringify({
      assertion: jwt,
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    })
  })
  .then((res) => {
    if (res.status !== 200) {
      console.log("[auth] API Error! Code: " + res.status)
      return
    }
    return res.json()
  })
  console.log(res)
  const token = res.access_token
  return token
}

console.log('custom auth lib loaded', get_access_token)
window.get_access_token = get_access_token // export
