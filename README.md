# set.js

In order to get yarn package installation with set-protocol-v2 (private repo), you will need to handle the following steps:

1. Make sure you are signed into Github.
2. Click on profile icon on top right corner
3. Click "Settings" in the dropdown
4. On the left-hand side, click "Developer Settings"
5. Select "Personal access tokens"
6. Click "Generate new token"
  a. Give it "repo" access with "Full control of private repositories"
  b. DO NOT CHECK THIS VALUE IN
  c. Place it in your .env file as the PERSONAL_ACCESS_TOKEN value
7. Run `yarn install` now which should handle fetching the private repo with the token and then resetting the value after it is done to keep it out of the checked in repository code.
8. If you happen to shut off `yarn install` early, make sure that the dependency line in the package.json looks like `"set-protocol-v2": "git+https://${$PERSONAL_ACCESS_TOKEN}:x-oauth-basic@github.com/SetProtocol/set-protocol-v2.git",` again.
