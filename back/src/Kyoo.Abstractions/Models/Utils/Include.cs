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
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Reflection;
using Kyoo.Abstractions.Models.Attributes;

namespace Kyoo.Abstractions.Models.Utils;

public class Include
{
	/// <summary>
	/// The aditional fields to include in the result.
	/// </summary>
	public ICollection<Metadata> Metadatas { get; init; } = ArraySegment<Metadata>.Empty;

	public abstract record Metadata(string Name);

	public record SingleRelation(string Name, Type type, string RelationIdName) : Metadata(Name);

	public record CustomRelation(string Name, Type type, string Sql, string? On, Type Declaring) : Metadata(Name);

	public record ProjectedRelation(string Name, string Sql) : Metadata(Name);
}

/// <summary>
/// The aditional fields to include in the result.
/// </summary>
/// <typeparam name="T">The type related to the new fields</typeparam>
public class Include<T> : Include
{
	/// <summary>
	/// The aditional fields names to include in the result.
	/// </summary>
	public ICollection<string> Fields => Metadatas.Select(x => x.Name).ToList();

	public Include() { }

	public Include(params string[] fields)
	{
		Type[] types = typeof(T).GetCustomAttribute<OneOfAttribute>()?.Types ?? new[] { typeof(T) };
		Metadatas = fields.SelectMany(key =>
		{
			var relations = types
				.Select(x => x.GetProperty(key, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance)!)
				.Select(prop => (prop, attr: prop?.GetCustomAttribute<LoadableRelationAttribute>()!))
				.Where(x => x.prop != null && x.attr != null)
				.ToList();
			if (!relations.Any())
				throw new ValidationException($"No loadable relation with the name {key}.");
			return relations
				.Select(x =>
				{
					(PropertyInfo prop, LoadableRelationAttribute attr) = x;

					if (attr.RelationID != null)
						return new SingleRelation(prop.Name, prop.PropertyType, attr.RelationID) as Metadata;
					if (attr.Sql != null)
						return new CustomRelation(prop.Name, prop.PropertyType, attr.Sql, attr.On, prop.DeclaringType!);
					if (attr.Projected != null)
						return new ProjectedRelation(prop.Name, attr.Projected);
					throw new NotImplementedException();
				})
				.Distinct();
		}).ToArray();
	}

	public static Include<T> From(string? fields)
	{
		if (string.IsNullOrEmpty(fields))
			return new Include<T>();
		return new Include<T>(fields.Split(','));
	}
}
