using System;
using System.Collections.Generic;
using Kyoo.Controllers;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	/// <summary>
	/// This class contains metadata about <see cref="IMetadataProvider"/>.
	/// You can have providers even if you don't have the corresponding <see cref="IMetadataProvider"/>.
	/// </summary>
	public class Provider : IResource, IThumbnails
	{
		/// <inheritdoc />
		public int ID { get; set; }
		
		/// <inheritdoc />
		public string Slug { get; set; }
		
		/// <summary>
		/// The name of this provider.
		/// </summary>
		public string Name { get; set; }
		
		/// <inheritdoc />
		public Dictionary<int, string> Images { get; set; }

		/// <summary>
		/// The path of this provider's logo.
		/// By default, the http path for this logo is returned from the public API.
		/// This can be disabled using the internal query flag.
		/// </summary>
		[SerializeAs("{HOST}/api/providers/{Slug}/logo")]
		[Obsolete("Use Images instead of this, this is only kept for the API response.")]
		public string Logo => Images?.GetValueOrDefault(Models.Images.Logo);

		/// <summary>
		/// The list of libraries that uses this provider.
		/// </summary>
		[LoadableRelation] public ICollection<Library> Libraries { get; set; }

		/// <summary>
		/// Create a new, default, <see cref="Provider"/>
		/// </summary>
		public Provider() { }

		/// <summary>
		/// Create a new <see cref="Provider"/> and specify it's <see cref="Name"/>.
		/// The <see cref="Slug"/> is automatically calculated from it's name.  
		/// </summary>
		/// <param name="name">The name of this provider.</param>
		/// <param name="logo">The logo of this provider.</param>
		public Provider(string name, string logo)
		{
			Slug = Utility.ToSlug(name);
			Name = name;
			Images = new Dictionary<int, string>
			{
				[Models.Images.Logo] = logo
			};
		}
	}
}