$(document).ready(function(){
	$( "#form_login" ).submit(function( event ) {
		console.log("submit");
		/* Stop form from submitting normally */
		event.preventDefault();
	
		var formData = $(this).serializeArray();
		$.ajax({
			// type: "GET",
			type: "GET",
			url: "/log",
			//dataType: "json",
			dataType: "html",
			data: formData,
			
			success: function(data){
				console.log(data);
				alert(data);
			},
	
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				//alert("Status: " + textStatus); alert("Error: " + errorThrown);
				console.log(XMLHttpRequest.responseText);
			
			}
		});
	});
});