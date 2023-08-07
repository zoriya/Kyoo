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
using System.Globalization;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;

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
		private readonly string? _slug;

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
		public Identifier(string slug)
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
				: slugFunc(_slug!);
		}

		/// <summary>
		/// Match a custom type to an identifier. This can be used for wrapped resources (see example for more details).
		/// </summary>
		/// <param name="idGetter">An expression to retrieve an ID from the type <typeparamref name="T"/>.</param>
		/// <param name="slugGetter">An expression to retrieve a slug from the type <typeparamref name="T"/>.</param>
		/// <typeparam name="T">The type to match against this identifier.</typeparam>
		/// <returns>An expression to match the type <typeparamref name="T"/> to this identifier.</returns>
		/// <example>
		/// <code lang="csharp">
		/// identifier.Matcher&lt;Season&gt;(x => x.ShowID, x => x.Show.Slug)
		/// </code>
		/// </example>
		public Expression<Func<T, bool>> Matcher<T>(Expression<Func<T, int>> idGetter,
			Expression<Func<T, string>> slugGetter)
		{
			ConstantExpression self = Expression.Constant(_id.HasValue ? _id.Value : _slug);
			BinaryExpression equal = Expression.Equal(_id.HasValue ? idGetter.Body : slugGetter.Body, self);
			ICollection<ParameterExpression> parameters = _id.HasValue ? idGetter.Parameters : slugGetter.Parameters;
			return Expression.Lambda<Func<T, bool>>(equal, parameters);
		}

		/// <summary>
		/// A matcher overload for nullable IDs. See
		/// <see cref="Matcher{T}(Expression{Func{T,int}},Expression{Func{T,string}})"/>
		/// for more details.
		/// </summary>
		/// <param name="idGetter">An expression to retrieve an ID from the type <typeparamref name="T"/>.</param>
		/// <param name="slugGetter">An expression to retrieve a slug from the type <typeparamref name="T"/>.</param>
		/// <typeparam name="T">The type to match against this identifier.</typeparam>
		/// <returns>An expression to match the type <typeparamref name="T"/> to this identifier.</returns>
		public Expression<Func<T, bool>> Matcher<T>(Expression<Func<T, int?>> idGetter,
			Expression<Func<T, string>> slugGetter)
		{
			ConstantExpression self = Expression.Constant(_id.HasValue ? _id.Value : _slug);
			BinaryExpression equal = Expression.Equal(_id.HasValue ? idGetter.Body : slugGetter.Body, self);
			ICollection<ParameterExpression> parameters = _id.HasValue ? idGetter.Parameters : slugGetter.Parameters;
			return Expression.Lambda<Func<T, bool>>(equal, parameters);
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
				id => resource.Id == id,
				slug => resource.Slug == slug
			);
		}

		/// <summary>
		/// Return an expression that return true if this <see cref="Identifier"/> match a given resource.
		/// </summary>
		/// <typeparam name="T">The type of resource to match against.</typeparam>
		/// <returns>
		/// <c>true</c> if the given resource match this identifier, <c>false</c> otherwise.
		/// </returns>
		public Expression<Func<T, bool>> IsSame<T>()
			where T : IResource
		{
			return _id.HasValue
				? x => x.Id == _id.Value
				: x => x.Slug == _slug;
		}

		/// <summary>
		/// Return an expression that return true if this <see cref="Identifier"/> is containing in a collection.
		/// </summary>
		/// <param name="listGetter">An expression to retrieve the list to check.</param>
		/// <typeparam name="T">The type that contain the list to check.</typeparam>
		/// <typeparam name="T2">The type of resource to check this identifier against.</typeparam>
		/// <returns>An expression to check if this <see cref="Identifier"/> is contained.</returns>
		public Expression<Func<T, bool>> IsContainedIn<T, T2>(Expression<Func<T, IEnumerable<T2>>> listGetter)
			where T2 : IResource
		{
			MethodInfo method = typeof(Enumerable)
				.GetMethods()
				.Where(x => x.Name == nameof(Enumerable.Any))
				.FirstOrDefault(x => x.GetParameters().Length == 2)!
				.MakeGenericMethod(typeof(T2));
			MethodCallExpression call = Expression.Call(null, method, listGetter.Body, IsSame<T2>());
			return Expression.Lambda<Func<T, bool>>(call, listGetter.Parameters);
		}

		/// <inheritdoc />
		public override string ToString()
		{
			return _id.HasValue
				? _id.Value.ToString()
				: _slug!;
		}

		/// <summary>
		/// A custom <see cref="TypeConverter"/> used to convert int or strings to an <see cref="Identifier"/>.
		/// </summary>
		public class IdentifierConvertor : TypeConverter
		{
			/// <inheritdoc />
			public override bool CanConvertFrom(ITypeDescriptorContext? context, Type sourceType)
			{
				if (sourceType == typeof(int) || sourceType == typeof(string))
					return true;
				return base.CanConvertFrom(context, sourceType);
			}

			/// <inheritdoc />
			public override object ConvertFrom(ITypeDescriptorContext? context, CultureInfo? culture, object value)
			{
				if (value is int id)
					return new Identifier(id);
				if (value is not string slug)
					return base.ConvertFrom(context, culture, value)!;
				return int.TryParse(slug, out id)
					? new Identifier(id)
					: new Identifier(slug);
			}
		}
	}
}
