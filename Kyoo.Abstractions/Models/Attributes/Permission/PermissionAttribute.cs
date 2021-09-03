using System;
using Kyoo.Abstractions.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Abstractions.Models.Permissions
{
	/// <summary>
	/// The kind of permission needed.
	/// </summary>
	public enum Kind
	{
		/// <summary>
		/// Allow the user to read for this kind of data.
		/// </summary>
		Read,

		/// <summary>
		/// Allow the user to write for this kind of data.
		/// </summary>
		Write,

		/// <summary>
		/// Allow the user to create this kind of data.
		/// </summary>
		Create,

		/// <summary>
		/// Allow the user to delete this kind od data.
		/// </summary>
		Delete
	}

	/// <summary>
	/// The group of the permission.
	/// </summary>
	public enum Group
	{
		/// <summary>
		/// Allow all operations on basic items types.
		/// </summary>
		Overall,

		/// <summary>
		/// Allow operation on sensitive items like libraries path, configurations and so on.
		/// </summary>
		Admin
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
		/// The group of this permission.
		/// </summary>
		public Group Group { get; }

		/// <summary>
		/// Ask a permission to run an action.
		/// </summary>
		/// <param name="type">
		/// The type of the action
		/// (if the type ends with api, it will be removed. This allow you to use nameof(YourApi)).
		/// </param>
		/// <param name="permission">The kind of permission needed.</param>
		/// <param name="group">
		/// The group of this permission (allow grouped permission like overall.read
		/// for all read permissions of this group).
		/// </param>
		public PermissionAttribute(string type, Kind permission, Group group = Group.Overall)
		{
			if (type.EndsWith("API", StringComparison.OrdinalIgnoreCase))
				type = type[..^3];
			Type = type.ToLower();
			Kind = permission;
			Group = group;
		}

		/// <inheritdoc />
		public IFilterMetadata CreateInstance(IServiceProvider serviceProvider)
		{
			return serviceProvider.GetRequiredService<IPermissionValidator>().Create(this);
		}

		/// <inheritdoc />
		public bool IsReusable => true;

		/// <summary>
		/// Return this permission attribute as a string.
		/// </summary>
		/// <returns>The string representation.</returns>
		public string AsPermissionString()
		{
			return Type;
		}
	}
}
