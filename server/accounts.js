var facebook = {
	service: "facebook",
    appId: "726903517340062",
    secret: "d085baf22691cc4f59efaf0815162bb4"
};

Accounts.loginServiceConfiguration.remove({
	service: "facebook"
});

Accounts.loginServiceConfiguration.insert(facebook);