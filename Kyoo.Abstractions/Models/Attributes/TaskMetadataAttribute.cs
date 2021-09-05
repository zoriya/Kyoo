using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using Kyoo.Abstractions.Controllers;

namespace Kyoo.Abstractions.Models.Attributes
{
	/// <summary>
	/// An attribute to inform how a <see cref="IFileSystem"/> works.
	/// </summary>
	[MetadataAttribute]
	[AttributeUsage(AttributeTargets.Class)]
	public class TaskMetadataAttribute : Attribute
	{
		/// <summary>
		/// The slug of the task, used to start it.
		/// </summary>
		public string Slug { get; }

		/// <summary>
		/// The name of the task that will be displayed to the user.
		/// </summary>
		public string Name { get; }

		/// <summary>
		/// A quick description of what this task will do.
		/// </summary>
		public string Description { get; }

		/// <summary>
		/// Should this task be automatically run at app startup?
		/// </summary>
		public bool RunOnStartup { get; set; }

		/// <summary>
		/// The priority of this task. Only used if <see cref="RunOnStartup"/> is true.
		/// It allow one to specify witch task will be started first as tasked are run on a Priority's descending order.
		/// </summary>
		public int Priority { get; set; }

		/// <summary>
		/// <c>true</c> if this task should not be displayed to the user, <c>false</c> otherwise.
		/// </summary>
		public bool IsHidden { get; set; }

		/// <summary>
		/// Create a new <see cref="TaskMetadataAttribute"/> with the given slug, name and description.
		/// </summary>
		/// <param name="slug">The slug of the task, used to start it.</param>
		/// <param name="name">The name of the task that will be displayed to the user.</param>
		/// <param name="description">A quick description of what this task will do.</param>
		public TaskMetadataAttribute(string slug, string name, string description)
		{
			Slug = slug;
			Name = name;
			Description = description;
		}

		/// <summary>
		/// Create a new <see cref="TaskMetadataAttribute"/> using a dictionary of metadata.
		/// </summary>
		/// <param name="metadata">
		/// The dictionary of metadata. This method expect the dictionary to contain a field
		/// per property in this attribute, with the same types as the properties of this attribute.
		/// </param>
		public TaskMetadataAttribute(IDictionary<string, object> metadata)
		{
			Slug = (string)metadata[nameof(Slug)];
			Name = (string)metadata[nameof(Name)];
			Description = (string)metadata[nameof(Description)];
			RunOnStartup = (bool)metadata[nameof(RunOnStartup)];
			Priority = (int)metadata[nameof(Priority)];
			IsHidden = (bool)metadata[nameof(IsHidden)];
		}
	}
}