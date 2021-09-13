$("#tabs a").on("click", function (e)
{
	e.preventDefault();
	$(this).tab("show");
});

$(".password-visibility a").on("click", function(e)
{
	e.preventDefault();
	let password = $(this).parent().siblings("input");
	let toggle = $(this).children("i");

	if (password.attr("type") === "text")
	{
		password.attr("type", "password");
		toggle.text("visibility");
	}
	else
	{
		toggle.text("visibility_off");
		password.attr("type", "text");
	}
});

$("#login-btn").on("click", function (e)
{
	e.preventDefault();

	let user = {
		username: $("#login-username")[0].value,
		password: $("#login-password")[0].value,
		stayLoggedIn: $("#remember-me")[0].checked
	};

	$.ajax(
		{
			url: "/api/account/login",
			type: "POST",
			contentType: 'application/json;charset=UTF-8',
			data: JSON.stringify(user),
			success: function ()
			{
				let returnUrl = new URLSearchParams(window.location.search).get("ReturnUrl");

				if (returnUrl == null)
					window.location.href = "/unauthorized";
				else
					window.location.href = returnUrl;
			},
			error: function(xhr)
			{
				let error = $("#login-error");
				error.show();
				error.text(JSON.parse(xhr.responseText)[0].description);
			}
		});
});

$("#register-btn").on("click", function (e)
{
	e.preventDefault();

	let user = {
		email: $("#register-email")[0].value,
		username: $("#register-username")[0].value,
		password: $("#register-password")[0].value
	};

	if (user.password !== $("#register-password-confirm")[0].value)
	{
		let error = $("#register-error");
		error.show();
		error.text("Passwords don't match.");
		return;
	}

	$.ajax(
	{
		url: "/api/account/register",
		type: "POST",
		contentType: 'application/json;charset=UTF-8',
		dataType: 'json',
		data: JSON.stringify(user),
		success: function(res)
		{
			useOtac(res.otac);
		},
		error: function(xhr)
		{
			let error = $("#register-error");
			error.show();
			error.html(Object.values(JSON.parse(xhr.responseText).errors).map(x => x[0]).join("<br/>"));
		}
	});
});

function useOtac(otac)
{
	$.ajax(
	{
		url: "/api/account/otac-login",
		type: "POST",
		contentType: 'application/json;charset=UTF-8',
		data: JSON.stringify({otac: otac, stayLoggedIn: $("#stay-logged-in")[0].checked}),
		success: function()
		{
			let returnUrl = new URLSearchParams(window.location.search).get("ReturnUrl");

			if (returnUrl == null)
				window.location.href = "/unauthorized";
			else
				window.location.href = returnUrl;
		},
		error: function(xhr)
		{
			let error = $("#register-error");
			error.show();
			error.text(JSON.parse(xhr.responseText)[0].description);
		}
	});
}



let otac = new URLSearchParams(window.location.search).get("otac");
if (otac != null)
	useOtac(otac);
