function triggerInstall() {
	console.log("Trigger install called");
	window.href = 
	chrome.webstore.install("https://chrome.google.com/webstore/detail/fhbjgbiflinjbdggehcddcbncdddomop", function() {
		console.log("Success");
	}, function(e) {
		console.log("Failed", e);
	});
}

$(".install-postman").on("click", function() {
	console.log("Trigger install");
	// TODO Temporary fix
	// if (typeof chrome !== 'undefined') {
	// 	triggerInstall();	
	// }
	// else {
		window.location.href = "https://chrome.google.com/webstore/detail/fhbjgbiflinjbdggehcddcbncdddomop";
	// }
	
});