using System;
using System.Linq.Expressions;
using Kyoo.Utils;

namespace Kyoo.Abstractions.Controllers
{
	/// <summary>
	/// Information about how a query should be sorted. What factor should decide the sort and in which order.
	/// </summary>
	/// <typeparam name="T">For witch type this sort applies</typeparam>
	public readonly struct Sort<T>
	{
		/// <summary>
		/// The sort key. This member will be used to sort the results.
		/// </summary>
		public Expression<Func<T, object>> Key { get; }

		/// <summary>
		/// If this is set to true, items will be sorted in descend order else, they will be sorted in ascendant order.
		/// </summary>
		public bool Descendant { get; }

		/// <summary>
		/// Create a new <see cref="Sort{T}"/> instance.
		/// </summary>
		/// <param name="key">The sort key given. It is assigned to <see cref="Key"/>.</param>
		/// <param name="descendant">Should this be in descendant order? The default is false.</param>
		/// <exception cref="ArgumentException">If the given key is not a member.</exception>
		public Sort(Expression<Func<T, object>> key, bool descendant = false)
		{
			Key = key;
			Descendant = descendant;

			if (!Utility.IsPropertyExpression(Key))
				throw new ArgumentException("The given sort key is not valid.");
		}

		/// <summary>
		/// Create a new <see cref="Sort{T}"/> instance from a key's name (case insensitive).
		/// </summary>
		/// <param name="sortBy">A key name with an optional order specifier. Format: "key:asc", "key:desc" or "key".</param>
		/// <exception cref="ArgumentException">An invalid key or sort specifier as been given.</exception>
		public Sort(string sortBy)
		{
			if (string.IsNullOrEmpty(sortBy))
			{
				Key = null;
				Descendant = false;
				return;
			}

			string key = sortBy.Contains(':') ? sortBy[..sortBy.IndexOf(':')] : sortBy;
			string order = sortBy.Contains(':') ? sortBy[(sortBy.IndexOf(':') + 1)..] : null;

			ParameterExpression param = Expression.Parameter(typeof(T), "x");
			MemberExpression property = Expression.Property(param, key);
			Key = property.Type.IsValueType
				? Expression.Lambda<Func<T, object>>(Expression.Convert(property, typeof(object)), param)
				: Expression.Lambda<Func<T, object>>(property, param);

			Descendant = order switch
			{
				"desc" => true,
				"asc" => false,
				null => false,
				_ => throw new ArgumentException($"The sort order, if set, should be :asc or :desc but it was :{order}.")
			};
		}
	}
}
