using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Reflection;
using Kyoo.Models;
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
			// modelBuilder.HasPostgresEnum<Status>();
			// modelBuilder.HasPostgresEnum<ItemType>();
			// modelBuilder.HasPostgresEnum<StreamType>();

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

			ValueConverter<Dictionary<string, string>, string> jsonConvertor = new(
				x => JsonConvert.SerializeObject(x),
				x => JsonConvert.DeserializeObject<Dictionary<string, string>>(x));
			modelBuilder.Entity<User>()
				.Property(x => x.ExtraData)
				.HasConversion(jsonConvertor);
			
			base.OnModelCreating(modelBuilder);
		}

		/// <inheritdoc />
		protected override bool IsDuplicateException(Exception ex)
		{
			return ex.InnerException is SqliteException { SqliteExtendedErrorCode: 2067 /*SQLITE_CONSTRAINT_UNIQUE*/}
			                         or SqliteException { SqliteExtendedErrorCode: 1555 /*SQLITE_CONSTRAINT_PRIMARYKEY*/};
		}

		/// <inheritdoc />
		public override Expression<Func<T, bool>> Like<T>(Expression<Func<T, string>> query, string format)
		{
			MethodInfo iLike = MethodOfUtils.MethodOf<string, string, bool>(EF.Functions.Like);
			MethodCallExpression call = Expression.Call(iLike, query.Body, Expression.Constant(format));

			return Expression.Lambda<Func<T, bool>>(call, query.Parameters);
		}
	}
}