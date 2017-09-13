function trackEvent(event_category, event_action, event_label) {
	var url = app_base + "/track?";
	url += "&app_name=" + app_name;
	url += "&tracker_id=" + tracker_id;
	url += "&ga_client_id=" + ga_client_id;
	url += "&app_version=" + app_version;
	url += "&event_category=" + event_category;
	url += "&event_action=" + event_action;
	url += "&event_label=" + event_label;

	console.log(url);

	$.ajax({
	    url: url,
	    type: "GET",
	    dataType: "json",	    
	    success: function(response) { 
	    	console.log("Event added");
	    }
	});
}