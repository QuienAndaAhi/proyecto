$(document).ready(function() {

	var errorUsu = false;
	var errorPass = false;
	var errorCPass = false;
	var errorNom = false;
	var errorApe = false;
	var errorEmail = false;
	
	$("form")[0].reset();

	$("#usuario").focusout(function()
	{
		$("#usuario").val($("#usuario").val().trim());
		if ($("#usuario").val()==''){
			$("#lusu").text("Inserta usuario");
			errorUsu = false;
		}

		else if ($("#usuario").val().length < 6 || $("#usuario").val().length > 15){
			$("#lusu").text("El usuario debe de tener entre 6 y 15 caracteres");
			errorUsu = false;
		}else{
			$("#lusu").text("");
			errorUsu = true;
		}
		
	});

	$("#pass").focusout(function()
	{
		if ($("#pass").val()==''){
			$("#lpass").text("Inserta password");
			errorPass = false;
		}

		else if ($("#pass").val().length < 8 || $("#pass").val().length > 15){
			$("#lpass").text("El password debe de tener entre 8 y 15 caracteres");
			errorPass = false;
		}else{
			$("#lpass").text("");
			errorPass = true;

			if ($("#cpass").val() == $("#pass").val()){
				$("#lcpass").text("");
			}
		}
		
	});

	$("#cpass").focusout(function()
	{
		if ($("#cpass").val()==''){
			$("#lcpass").text("Inserta password");
			errorCPass = false;
		}

		else if ($("#cpass").val() != $("#pass").val()){
			$("#lcpass").text("El password debe ser identico al insertado anteriormente");
			errorCPass = false;
		}else{
			$("#lcpass").text("");
			errorCPass = true;
		}
		
	});

	$("#nombre").focusout(function()
	{
		if ($("#nombre").val()==''){
			$("#lnom").text("Inserta el nombre");
			errorNom = false;
		}
		else{
			$("#lnom").text("");
			errorNom = true;
		}
		
	});

	$("#apellido").focusout(function()
	{
		if ($("#apellido").val()==''){
			$("#lape").text("Inserta el apellido");
			errorApe = false;
		}
		else{
			$("#lape").text("");
			errorApe = true;
		}
		
	});

	function validar_email(valor)
	{
		// creamos nuestra regla con expresiones regulares.
		var filter = /[\w-\.]{2,}@([\w-]{2,}\.)*([\w-]{2,}\.)[\w-]{2,4}/;
		// utilizamos test para comprobar si el parametro valor cumple la regla
		if(filter.test(valor))
			return true;
		else
			return false;
	}

	$("#email").focusout(function()
	{


		if ($("#email").val()==''){
			$("#lema").text("Inserta el email");
			errorEmail = false;
		}
		else if(validar_email($("#email").val()) == false){
            $("#lema").text("El correo electrónico introducido no es correcto");
            errorEmail = false;

     	}
		else{
			$("#lema").text("");
			errorEmail = true;
		}
		
	});

	$("#registro").click(function() {
		var usuario = $("#usuario").val();
		var password = $("#pass").val();
		var cpassword = $("#cpass").val();
		var nombre = $("#nombre").val();
		var apellido = $("#apellido").val();
		var email = $("#email").val();

		if (errorUsu == false || errorPass == false || errorCPass == false || errorNom == false || errorApe == false || errorEmail == false){
			alert("Compueba el formulario");
		} else {

			var data =  {
			usu: usuario,
			pass: password,
			cpass: cpassword,
			nombre: nombre,
			apellido: apellido,
			email1: email
			};

			$.ajax({
				type: "POST",
			url: "/registro",
			dataType: "json",
			data: data,
			
			success: function(data){
				console.log(data);
				alert(data);
			},
	
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				//alert("Status: " + textStatus); alert("Error: " + errorThrown);
				console.log(XMLHttpRequest.responseText);
			
			}
			})
		}
	});
});