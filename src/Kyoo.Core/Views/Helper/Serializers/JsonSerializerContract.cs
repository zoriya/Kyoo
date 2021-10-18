// Kyoo - A portable and vast media library solution.
// Copyright (c) Kyoo.
//
// See AUTHORS.md and LICENSE file in the project root for full license information.
//
// Kyoo is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// Kyoo is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Kyoo. If not, see <https://www.gnu.org/licenses/>.

using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Reflection;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Core.Models.Options;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace Kyoo.Core.Api
{
	/// <summary>
	/// A custom json serializer that respects <see cref="SerializeIgnoreAttribute"/> and
	/// <see cref="DeserializeIgnoreAttribute"/>. It also handle <see cref="LoadableRelationAttribute"/> via the
	/// <c>fields</c> query parameter and <see cref="IThumbnails"/> items.
	/// </summary>
	public class JsonSerializerContract : CamelCasePropertyNamesContractResolver
	{
		/// <summary>
		/// The http context accessor used to retrieve the <c>fields</c> query parameter as well as the type of
		/// resource currently serializing.
		/// </summary>
		private readonly IHttpContextAccessor _httpContextAccessor;

		/// <summary>
		/// The options containing the public URL of kyoo.
		/// </summary>
		private readonly IOptions<BasicOptions> _options;

		/// <summary>
		/// Create a new <see cref="JsonSerializerContract"/>.
		/// </summary>
		/// <param name="httpContextAccessor">The http context accessor to use.</param>
		/// <param name="options">The options containing the public URL of kyoo.</param>
		public JsonSerializerContract(IHttpContextAccessor httpContextAccessor, IOptions<BasicOptions> options)
		{
			_httpContextAccessor = httpContextAccessor;
			_options = options;
		}

		/// <inheritdoc />
		protected override JsonProperty CreateProperty(MemberInfo member, MemberSerialization memberSerialization)
		{
			JsonProperty property = base.CreateProperty(member, memberSerialization);

			LoadableRelationAttribute relation = member.GetCustomAttribute<LoadableRelationAttribute>();
			if (relation != null)
			{
				property.ShouldSerialize = _ =>
				{
					string resType = (string)_httpContextAccessor.HttpContext!.Items["ResourceType"];
					if (member.DeclaringType!.Name != resType)
						return false;
					ICollection<string> fields = (ICollection<string>)_httpContextAccessor.HttpContext!.Items["fields"];
					return fields!.Contains(member.Name);
				};
			}

			if (member.GetCustomAttribute<SerializeIgnoreAttribute>() != null)
				property.ShouldSerialize = _ => false;
			if (member.GetCustomAttribute<DeserializeIgnoreAttribute>() != null)
				property.ShouldDeserialize = _ => false;
			return property;
		}

		/// <inheritdoc />
		protected override IList<JsonProperty> CreateProperties(Type type, MemberSerialization memberSerialization)
		{
			IList<JsonProperty> properties = base.CreateProperties(type, memberSerialization);
			if (!type.IsAssignableTo(typeof(IThumbnails)))
				return properties;
			foreach ((int id, string image) in Images.ImageName)
			{
				properties.Add(new JsonProperty
				{
					DeclaringType = type,
					PropertyName = image.ToLower(),
					UnderlyingName = image,
					PropertyType = typeof(string),
					Readable = true,
					Writable = false,
					ItemIsReference = false,
					TypeNameHandling = TypeNameHandling.None,
					ShouldSerialize = x =>
					{
						IThumbnails thumb = (IThumbnails)x;
						return thumb?.Images?.ContainsKey(id) == true;
					},
					ValueProvider = new ThumbnailProvider(_options.Value.PublicUrl, id)
				});
			}

			return properties;
		}

		/// <summary>
		/// A custom <see cref="IValueProvider"/> that uses the
		/// <see cref="IThumbnails"/>.<see cref="IThumbnails.Images"/> as a value.
		/// </summary>
		private class ThumbnailProvider : IValueProvider
		{
			/// <summary>
			/// The public address of kyoo.
			/// </summary>
			private readonly Uri _host;

			/// <summary>
			/// The index/ID of the image to retrieve/set.
			/// </summary>
			private readonly int _imageIndex;

			/// <summary>
			/// Create a new <see cref="ThumbnailProvider"/>.
			/// </summary>
			/// <param name="host">The public address of kyoo.</param>
			/// <param name="imageIndex">The index/ID of the image to retrieve/set.</param>
			public ThumbnailProvider(Uri host, int imageIndex)
			{
				_host = host;
				_imageIndex = imageIndex;
			}

			/// <inheritdoc />
			public void SetValue(object target, object value)
			{
				if (target is not IThumbnails thumb)
					throw new ArgumentException($"The given object is not an Thumbnail.");
				thumb.Images[_imageIndex] = value as string;
			}

			/// <inheritdoc />
			public object GetValue(object target)
			{
				string slug = (target as IResource)?.Slug ?? (target as ICustomTypeDescriptor)?.GetComponentName();
				if (target is not IThumbnails thumb
					|| slug == null
					|| string.IsNullOrEmpty(thumb.Images?.GetValueOrDefault(_imageIndex)))
					return null;
				string type = target is ICustomTypeDescriptor descriptor
					? descriptor.GetClassName()
					: target.GetType().Name;
				return new Uri(_host, $"/api/{type}/{slug}/{Images.ImageName[_imageIndex]}".ToLower())
					.ToString();
			}
		}
	}
}
