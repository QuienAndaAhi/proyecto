$(document).ready(function() {

	var errorUsu = false;
	var errorPass = false;
	var errorCPass = false;
	var errorNom = false;
	var errorApe = false;
	var errorEmail = false;
	var errordir = false;
	var errordesc = false;
	var errorrecin = false;
	var errorciud = false;
	
	$("form")[0].reset();

	$("#passreg").focusout(function()
	{
		if ($("#passreg").val()==''){
			$("#lpass").text("Inserta password");
			errorPass = false;
		}

		else if ($("#passreg").val().length < 8 || $("#passreg").val().length > 15){
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

		else if ($("#cpass").val() != $("#passreg").val()){
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
	$("#ciudad").focusout(function()
	{
		if ($("#ciudad").val()==''){
			$("#lciu").text("Inserta tu ciudad");
			errorciud= false;
		}
		else{
			$("#lciu").text("");
			errorciud = true;
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

	 $('#dueno').change(function() {
        if($(this).is(":checked")) {
        	console.log("kk");
        	var newdiv1 = $( "<div id='dR'><div><label>Direccion recinto:</label><input type='text' name='dDireccion' id='direccion' value=''></div><div><label id='ldir'> </label></div></br><div><label>Nombre recinto:</label><input type='text' name='dnombrerec' id='nombreRecinto' value=''></div><div><label id='lnomrec'> </label></div></br><div><label>Descripción:</label><textarea type='text' name='ddescripcion' id='descripcion' value=''></textarea></div><div><label id='ldesc'> </label></div></br> </div>" );
           	$("#direccion").geocomplete();
            $('#datRecinto').append(newdiv1);
            $("#direccion").focusout(function()
				{
				if ($("#direccion").val()==''){
					$("#ldir").text("Inserta una direccion");
					errordir = false;
				}
				else{
					$("#ldir").text("");
					errordir = true;
				}
		
			});
			 $("#nombreRecinto").focusout(function()
				{
				if ($("#nombreRecinto").val()==''){
					$("#lnomRec").text("Inserta un nombre de recinto");
					errorrecin = false;
				}
				else{
					$("#lnomRec").text("");
					errorrecin = true;
				}
		
			});
			  $("#descripcion").focusout(function()
				{
				if ($("#descripcion").val()==''){
					$("#ldesc").text("Inserta una descripcion");
					errordesc = false;
				}
				else{
					$("#ldesc").text("");
					errordesc = true;
				}
		
			});
        }else{
        	$('#dR').remove();
        }

                
    });



	$("#registro").click(function() {
		var usuario = $("#usuarioreg").val();
		var ciudad= $("#ciudad").val();
		var password = $("#passreg").val();
		var cpassword = $("#cpass").val();
		var nombre = $("#nombre").val();
		var apellido = $("#apellido").val();
		var email = $("#emailreg").val();
		var dueno=0;
		if($("#dueno").is(":checked")) {
			if ( errorciud == false || errorPass == false || errorCPass == false || errorNom == false || errorApe == false || errordir == false || errordesc == false || errorrecin == false){
			alert("Compueba el formulario");
			} else {

				var data =  {
				"usu": usuario,
				"pass": password,
				"cpass": cpassword,
				"ciudad": ciudad,
				"nombre": nombre,
				"apellido": apellido,
				"email": email,
				"dueno":0,
				"direccion":$("#direccion").val(),
				"nombrerecinto":$("#nombreRecinto").val(),
				"descripcion":$("#descripcion").val()
				};

				$.ajax({
					type: "POST",
				url: "/registrodueno",
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
		}else{
			if (errorciud == false || errorPass == false || errorCPass == false || errorNom == false || errorApe == false ){
				alert("Compueba el formulario");
			} else {

				var data =  {
				"usu": usuario,
				"pass": password,
				"cpass": cpassword,
				"nombre": nombre,
				"ciudad": ciudad,
				"apellido": apellido,
				"email": email,
				"dueno":0
				};

				$.ajax({
					type: "POST",
				url: "/registro",
				dataType: "json",
				data: data,
				
				success: function(data){
					console.log(data);
					window.location = "/";
				},
		
				error: function(XMLHttpRequest, textStatus, errorThrown) {
					//alert("Status: " + textStatus); alert("Error: " + errorThrown);
					console.log(errorThrown);
				
				}
				})
			}
		}
	});
});