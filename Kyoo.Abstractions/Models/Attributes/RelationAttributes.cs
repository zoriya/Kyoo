using System;
using Kyoo.Abstractions.Controllers;

namespace Kyoo.Abstractions.Models.Attributes
{
	/// <summary>
	/// The targeted relation can be edited via calls to the repository's <see cref="IRepository{T}.Edit"/> method.
	/// </summary>
	[AttributeUsage(AttributeTargets.Property)]
	public class EditableRelationAttribute : Attribute { }

	/// <summary>
	/// The targeted relation can be loaded via a call to <see cref="ILibraryManager.Load"/>.
	/// </summary>
	[AttributeUsage(AttributeTargets.Property)]
	public class LoadableRelationAttribute : Attribute
	{
		/// <summary>
		/// The name of the field containing the related resource's ID.
		/// </summary>
		public string RelationID { get; }

		/// <summary>
		/// Create a new <see cref="LoadableRelationAttribute"/>.
		/// </summary>
		public LoadableRelationAttribute() { }

		/// <summary>
		/// Create a new <see cref="LoadableRelationAttribute"/> with a baking relationID field.
		/// </summary>
		/// <param name="relationID">The name of the RelationID field.</param>
		public LoadableRelationAttribute(string relationID)
		{
			RelationID = relationID;
		}
	}
}
