var facebook = {
    appID: 726903517340062,
    appSecret: "d085baf22691cc4f59efaf0815162bb4"
};

Accounts.loginServiceConfiguration.insert({
	service: "facebook",
	appID: facebook.appID,
	secret: facebook.appSecret
});