var facebook = {
    appId: "726903517340062",
    secret: "d085baf22691cc4f59efaf0815162bb4"
};

ServiceConfiguration.configurations.remove({
	service: "facebook"
});

ServiceConfiguration.configurations.insert({
	service: "facebook",
	appId: facebook.appId,
	secret: facebook.secret
});