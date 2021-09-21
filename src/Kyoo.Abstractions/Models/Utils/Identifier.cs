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
using System.ComponentModel;
using System.Globalization;
using System.Linq.Expressions;
using JetBrains.Annotations;

namespace Kyoo.Abstractions.Models.Utils
{
	/// <summary>
	/// A class that represent a resource. It is made to be used as a parameter in a query and not used somewhere else
	/// on the application.
	/// This class allow routes to be used via ether IDs or Slugs, this is suitable for every <see cref="IResource"/>.
	/// </summary>
	[TypeConverter(typeof(IdentifierConvertor))]
	public class Identifier
	{
		/// <summary>
		/// The ID of the resource or null if the slug is specified.
		/// </summary>
		private readonly int? _id;

		/// <summary>
		/// The slug of the resource or null if the id is specified.
		/// </summary>
		private readonly string _slug;

		/// <summary>
		/// Create a new <see cref="Identifier"/> for the given id.
		/// </summary>
		/// <param name="id">The id of the resource.</param>
		public Identifier(int id)
		{
			_id = id;
		}

		/// <summary>
		/// Create a new <see cref="Identifier"/> for the given slug.
		/// </summary>
		/// <param name="slug">The slug of the resource.</param>
		public Identifier([NotNull] string slug)
		{
			if (slug == null)
				throw new ArgumentNullException(nameof(slug));
			_slug = slug;
		}

		/// <summary>
		/// Pattern match out of the identifier to a resource.
		/// </summary>
		/// <param name="idFunc">The function to match the ID to a type <typeparamref name="T"/>.</param>
		/// <param name="slugFunc">The function to match the slug to a type <typeparamref name="T"/>.</param>
		/// <typeparam name="T">The return type that will be converted to from an ID or a slug.</typeparam>
		/// <returns>
		/// The result of the <paramref name="idFunc"/> or <paramref name="slugFunc"/> depending on the pattern.
		/// </returns>
		/// <example>
		/// Example usage:
		/// <code lang="csharp">
		/// T ret = await identifier.Match(
		///      id => _repository.GetOrDefault(id),
		///      slug => _repository.GetOrDefault(slug)
		/// );
		/// </code>
		/// </example>
		public T Match<T>(Func<int, T> idFunc, Func<string, T> slugFunc)
		{
			return _id.HasValue
				? idFunc(_id.Value)
				: slugFunc(_slug);
		}

		/// <summary>
		/// Return true if this <see cref="Identifier"/> match a resource.
		/// </summary>
		/// <param name="resource">The resource to match</param>
		/// <returns>
		/// <c>true</c> if the <paramref name="resource"/> match this identifier, <c>false</c> otherwise.
		/// </returns>
		public bool IsSame(IResource resource)
		{
			return Match(
				id => resource.ID == id,
				slug => resource.Slug == slug
			);
		}

		public Expression<Func<T, bool>> IsSame<T>()
			where T : IResource
		{
			return _id.HasValue
				? x => x.ID == _id
				: x => x.Slug == _slug;
		}

		public class IdentifierConvertor : TypeConverter
		{
			/// <inheritdoc />
			public override bool CanConvertFrom(ITypeDescriptorContext context, Type sourceType)
			{
				if (sourceType == typeof(int) || sourceType == typeof(string))
					return true;
				return base.CanConvertFrom(context, sourceType);
			}

			/// <inheritdoc />
			public override object ConvertFrom(ITypeDescriptorContext context, CultureInfo culture, object value)
			{
				if (value is int id)
					return new Identifier(id);
				if (value is not string slug)
					return base.ConvertFrom(context, culture, value);
				return int.TryParse(slug, out id)
					? new Identifier(id)
					: new Identifier(slug);
			}
		}
	}
}
