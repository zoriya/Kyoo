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
using System.Linq.Expressions;
using System.Reflection;
using Kyoo.Abstractions.Models;
using Kyoo.Database;
using Kyoo.Utils;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Newtonsoft.Json;

namespace Kyoo.SqLite
{
	/// <summary>
	/// A sqlite implementation of <see cref="DatabaseContext"/>.
	/// </summary>
	public class SqLiteContext : DatabaseContext
	{
		/// <summary>
		/// The connection string to use.
		/// </summary>
		private readonly string _connection;

		/// <summary>
		/// Is this instance in debug mode?
		/// </summary>
		private readonly bool _debugMode;

		/// <summary>
		/// Should the configure step be skipped? This is used when the database is created via DbContextOptions.
		/// </summary>
		private readonly bool _skipConfigure;

		/// <summary>
		/// A basic constructor that set default values (query tracker behaviors, mapping enums...)
		/// </summary>
		public SqLiteContext()
		{ }

		/// <summary>
		/// Create a new <see cref="SqLiteContext"/> using specific options
		/// </summary>
		/// <param name="options">The options to use.</param>
		public SqLiteContext(DbContextOptions options)
			: base(options)
		{
			_skipConfigure = true;
		}

		/// <summary>
		/// A basic constructor that set default values (query tracker behaviors, mapping enums...)
		/// </summary>
		/// <param name="connection">The connection string to use</param>
		/// <param name="debugMode">Is this instance in debug mode?</param>
		public SqLiteContext(string connection, bool debugMode)
		{
			_connection = connection;
			_debugMode = debugMode;
		}

		/// <summary>
		/// Set connection information for this database context
		/// </summary>
		/// <param name="optionsBuilder">An option builder to fill.</param>
		protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
		{
			if (!_skipConfigure)
			{
				if (_connection != null)
					optionsBuilder.UseSqlite(_connection);
				else
					optionsBuilder.UseSqlite();
				if (_debugMode)
					optionsBuilder.EnableDetailedErrors().EnableSensitiveDataLogging();
			}

			base.OnConfiguring(optionsBuilder);
		}

		/// <summary>
		/// Set database parameters to support every types of Kyoo.
		/// </summary>
		/// <param name="modelBuilder">The database's model builder.</param>
		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			ValueConverter<string[], string> arrayConvertor = new(
				x => string.Join(";", x),
				x => x.Split(';', StringSplitOptions.None));
			modelBuilder.Entity<Library>()
				.Property(x => x.Paths)
				.HasConversion(arrayConvertor);
			modelBuilder.Entity<Show>()
				.Property(x => x.Aliases)
				.HasConversion(arrayConvertor);
			modelBuilder.Entity<User>()
				.Property(x => x.Permissions)
				.HasConversion(arrayConvertor);

			modelBuilder.Entity<Show>()
				.Property(x => x.Status)
				.HasConversion<int>();
			modelBuilder.Entity<Track>()
				.Property(x => x.Type)
				.HasConversion<int>();

			ValueConverter<Dictionary<string, string>, string> extraDataConvertor = new(
				x => JsonConvert.SerializeObject(x),
				x => JsonConvert.DeserializeObject<Dictionary<string, string>>(x));
			modelBuilder.Entity<User>()
				.Property(x => x.ExtraData)
				.HasConversion(extraDataConvertor);

			ValueConverter<Dictionary<int, string>, string> jsonConvertor = new(
				x => JsonConvert.SerializeObject(x),
				x => JsonConvert.DeserializeObject<Dictionary<int, string>>(x));
			modelBuilder.Entity<LibraryItem>()
				.Property(x => x.Images)
				.HasConversion(jsonConvertor);
			modelBuilder.Entity<Collection>()
				.Property(x => x.Images)
				.HasConversion(jsonConvertor);
			modelBuilder.Entity<Show>()
				.Property(x => x.Images)
				.HasConversion(jsonConvertor);
			modelBuilder.Entity<Season>()
				.Property(x => x.Images)
				.HasConversion(jsonConvertor);
			modelBuilder.Entity<Episode>()
				.Property(x => x.Images)
				.HasConversion(jsonConvertor);
			modelBuilder.Entity<People>()
				.Property(x => x.Images)
				.HasConversion(jsonConvertor);
			modelBuilder.Entity<Provider>()
				.Property(x => x.Images)
				.HasConversion(jsonConvertor);
			modelBuilder.Entity<User>()
				.Property(x => x.Images)
				.HasConversion(jsonConvertor);

			modelBuilder.Entity<LibraryItem>()
				.ToView("LibraryItems")
				.HasKey(x => x.ID);
			base.OnModelCreating(modelBuilder);
		}

		/// <inheritdoc />
		protected override string MetadataName<T>()
		{
			return typeof(T).Name + nameof(MetadataID);
		}

		/// <inheritdoc />
		protected override string LinkName<T, T2>()
		{
			return "Link" + typeof(T).Name + typeof(T2).Name;
		}

		/// <inheritdoc />
		protected override string LinkNameFk<T>()
		{
			return typeof(T).Name + "ID";
		}

		/// <inheritdoc />
		protected override bool IsDuplicateException(Exception ex)
		{
			return ex.InnerException
				is SqliteException { SqliteExtendedErrorCode: 2067 /* SQLITE_CONSTRAINT_UNIQUE */ }
				or SqliteException { SqliteExtendedErrorCode: 1555 /* SQLITE_CONSTRAINT_PRIMARYKEY */ };
		}

		/// <inheritdoc />
		public override Expression<Func<T, bool>> Like<T>(Expression<Func<T, string>> query, string format)
		{
			MethodInfo iLike = MethodOfUtils.MethodOf<string, string, bool>(EF.Functions.Like);
			MethodCallExpression call = Expression.Call(iLike, Expression.Constant(EF.Functions), query.Body, Expression.Constant(format));

			return Expression.Lambda<Func<T, bool>>(call, query.Parameters);
		}
	}
}
