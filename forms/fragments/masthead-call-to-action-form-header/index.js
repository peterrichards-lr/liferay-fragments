setTimeout(function(){ 

$('.masthead-form .btn-primary').click(function() {
  var now = new Date();
  now.setTime(now.getTime() + 1 * 3600 * 1000);
	document.cookie = "newsletter=true; Path=/; expires=" + now.toUTCString();
});
	
}, 5000);