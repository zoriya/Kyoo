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
using System.Globalization;
using System.Linq.Expressions;
using System.Reflection;
using EFCore.NamingConventions.Internal;
using Kyoo.Abstractions.Models;
using Kyoo.Utils;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Kyoo.Postgresql
{
	/// <summary>
	/// A postgresql implementation of <see cref="DatabaseContext"/>.
	/// </summary>
	public class PostgresContext : DatabaseContext
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

		// TOOD: This needs ot be updated but ef-core still does not offer a way to use this.
		[Obsolete]
		static PostgresContext()
		{
			NpgsqlConnection.GlobalTypeMapper.MapEnum<Status>();
			NpgsqlConnection.GlobalTypeMapper.MapEnum<ItemType>();
		}

		/// <summary>
		/// A basic constructor that set default values (query tracker behaviors, mapping enums...)
		/// </summary>
		public PostgresContext() { }

		/// <summary>
		/// Create a new <see cref="PostgresContext"/> using specific options
		/// </summary>
		/// <param name="options">The options to use.</param>
		public PostgresContext(DbContextOptions options)
			: base(options)
		{
			_skipConfigure = true;
		}

		/// <summary>
		/// A basic constructor that set default values (query tracker behaviors, mapping enums...)
		/// </summary>
		/// <param name="connection">The connection string to use</param>
		/// <param name="debugMode">Is this instance in debug mode?</param>
		public PostgresContext(string connection, bool debugMode)
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
				optionsBuilder.UseNpgsql();
				if (_debugMode)
					optionsBuilder.EnableDetailedErrors().EnableSensitiveDataLogging();
			}

			optionsBuilder.UseSnakeCaseNamingConvention();
			base.OnConfiguring(optionsBuilder);
		}

		/// <summary>
		/// Set database parameters to support every types of Kyoo.
		/// </summary>
		/// <param name="modelBuilder">The database's model builder.</param>
		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			modelBuilder.HasPostgresEnum<Status>();
			modelBuilder.HasPostgresEnum<ItemType>();

			modelBuilder.Entity<LibraryItem>()
				.ToView("library_items")
				.HasKey(x => x.ID);

			modelBuilder.Entity<User>()
				.Property(x => x.ExtraData)
				.HasColumnType("jsonb");

			modelBuilder.Entity<LibraryItem>()
				.Property(x => x.Images)
				.HasColumnType("jsonb");
			modelBuilder.Entity<Collection>()
				.Property(x => x.Images)
				.HasColumnType("jsonb");
			modelBuilder.Entity<Show>()
				.Property(x => x.Images)
				.HasColumnType("jsonb");
			modelBuilder.Entity<Season>()
				.Property(x => x.Images)
				.HasColumnType("jsonb");
			modelBuilder.Entity<Episode>()
				.Property(x => x.Images)
				.HasColumnType("jsonb");
			modelBuilder.Entity<People>()
				.Property(x => x.Images)
				.HasColumnType("jsonb");
			modelBuilder.Entity<Provider>()
				.Property(x => x.Images)
				.HasColumnType("jsonb");
			modelBuilder.Entity<User>()
				.Property(x => x.Images)
				.HasColumnType("jsonb");

			base.OnModelCreating(modelBuilder);
		}

		/// <inheritdoc />
		protected override string MetadataName<T>()
		{
			SnakeCaseNameRewriter rewriter = new(CultureInfo.InvariantCulture);
			return rewriter.RewriteName(typeof(T).Name + nameof(MetadataID));
		}

		/// <inheritdoc />
		protected override string LinkName<T, T2>()
		{
			SnakeCaseNameRewriter rewriter = new(CultureInfo.InvariantCulture);
			return rewriter.RewriteName("Link" + typeof(T).Name + typeof(T2).Name);
		}

		/// <inheritdoc />
		protected override string LinkNameFk<T>()
		{
			SnakeCaseNameRewriter rewriter = new(CultureInfo.InvariantCulture);
			return rewriter.RewriteName(typeof(T).Name + "ID");
		}

		/// <inheritdoc />
		protected override bool IsDuplicateException(Exception ex)
		{
			return ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
		}

		/// <inheritdoc />
		public override Expression<Func<T, bool>> Like<T>(Expression<Func<T, string>> query, string format)
		{
			MethodInfo iLike = MethodOfUtils.MethodOf<string, string, bool>(EF.Functions.ILike);
			MethodCallExpression call = Expression.Call(iLike, Expression.Constant(EF.Functions), query.Body, Expression.Constant(format));

			return Expression.Lambda<Func<T, bool>>(call, query.Parameters);
		}
	}
}
