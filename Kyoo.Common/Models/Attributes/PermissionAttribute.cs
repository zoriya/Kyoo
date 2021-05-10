using System;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Models.Permissions
{
	/// <summary>
	/// The kind of permission needed.
	/// </summary>
	public enum Kind
	{
		Read,
		Write,
		Create,
		Delete
	}
	
	/// <summary>
	/// Specify permissions needed for the API.
	/// </summary>
	[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
	public class PermissionAttribute : Attribute, IFilterFactory
	{
		/// <summary>
		/// The needed permission as string.
		/// </summary>
		public string Type { get; }
		/// <summary>
		/// The needed permission kind.
		/// </summary>
		public Kind Kind { get; }

		/// <summary>
		/// Ask a permission to run an action. 
		/// </summary>
		/// <param name="type">
		/// The type of the action
		/// (if the type ends with api, it will be removed. This allow you to use nameof(YourApi)).
		/// </param>
		/// <param name="permission">The kind of permission needed</param>
		public PermissionAttribute(string type, Kind permission)
		{
			if (type.EndsWith("API", StringComparison.OrdinalIgnoreCase))
				type = type[..^3];
			Type = type.ToLower();
			Kind = permission;
		}
		
		/// <inheritdoc />
		public IFilterMetadata CreateInstance(IServiceProvider serviceProvider)
		{
			return serviceProvider.GetRequiredService<IPermissionValidator>().Create(this);
		}

		/// <inheritdoc />
		public bool IsReusable => true;

		/// <summary>
		/// Return this permission attribute as a string
		/// </summary>
		/// <returns>The string representation.</returns>
		public string AsPermissionString()
		{
			return Type;
		}
	}

	/// <summary>
	/// Specify one part of a permissions needed for the API (the kind or the type).
	/// </summary>
	[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
	public class PartialPermissionAttribute : Attribute, IFilterFactory
	{
		/// <summary>
		/// The needed permission type.
		/// </summary>
		public string Type { get; }
		/// <summary>
		/// The needed permission kind.
		/// </summary>
		public Kind Kind { get; }
		
		/// <summary>
		/// Ask a permission to run an action. 
		/// </summary>
		/// <remarks>
		/// With this attribute, you can only specify a type or a kind.
		/// To have a valid permission attribute, you must specify the kind and the permission using two attributes.
		/// Those attributes can be dispatched at different places (one on the class, one on the method for example).
		/// If you don't put exactly two of those attributes, the permission attribute will be ill-formed and will
		/// lead to unspecified behaviors. 
		/// </remarks>
		/// <param name="type">
		/// The type of the action
		/// (if the type ends with api, it will be removed. This allow you to use nameof(YourApi)).
		/// </param>
		public PartialPermissionAttribute(string type)
		{
			if (type.EndsWith("API", StringComparison.OrdinalIgnoreCase))
				type = type[..^3];
			Type = type.ToLower();
		}
		
		/// <summary>
		/// Ask a permission to run an action. 
		/// </summary>
		/// <remarks>
		/// With this attribute, you can only specify a type or a kind.
		/// To have a valid permission attribute, you must specify the kind and the permission using two attributes.
		/// Those attributes can be dispatched at different places (one on the class, one on the method for example).
		/// If you don't put exactly two of those attributes, the permission attribute will be ill-formed and will
		/// lead to unspecified behaviors. 
		/// </remarks>
		/// <param name="permission">The kind of permission needed</param>
		public PartialPermissionAttribute(Kind permission)
		{
			Kind = permission;
		}
		
		/// <inheritdoc />
		public IFilterMetadata CreateInstance(IServiceProvider serviceProvider)
		{
			return serviceProvider.GetRequiredService<IPermissionValidator>().Create(this);
		}

		/// <inheritdoc />
		public bool IsReusable => true;
	}


	/// <summary>
	/// A service to validate permissions
	/// </summary>
	public interface IPermissionValidator
	{
		/// <summary>
		/// Create an IAuthorizationFilter that will be used to validate permissions.
		/// This can registered with any lifetime.
		/// </summary>
		/// <param name="attribute">The permission attribute to validate</param>
		/// <returns>An authorization filter used to validate the permission</returns>
		IFilterMetadata Create(PermissionAttribute attribute);
		
		/// <summary>
		/// Create an IAuthorizationFilter that will be used to validate permissions.
		/// This can registered with any lifetime.
		/// </summary>
		/// <param name="attribute">
		/// A partial attribute to validate. See <see cref="PartialPermissionAttribute"/>.
		/// </param>
		/// <returns>An authorization filter used to validate the permission</returns>
		IFilterMetadata Create(PartialPermissionAttribute attribute);
	}
}