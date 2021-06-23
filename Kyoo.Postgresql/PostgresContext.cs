using System;
using System.Linq.Expressions;
using System.Reflection;
using Kyoo.Models;
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


		static PostgresContext()
		{
			NpgsqlConnection.GlobalTypeMapper.MapEnum<Status>();
			NpgsqlConnection.GlobalTypeMapper.MapEnum<ItemType>();
			NpgsqlConnection.GlobalTypeMapper.MapEnum<StreamType>();
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
				if (_connection != null)
					optionsBuilder.UseNpgsql(_connection);
				else
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
			modelBuilder.HasPostgresEnum<StreamType>();

			modelBuilder.Entity<User>()
				.Property(x => x.ExtraData)
				.HasColumnType("jsonb");
			
			base.OnModelCreating(modelBuilder);
		}

		/// <inheritdoc />
		protected override bool IsDuplicateException(Exception ex)
		{
			return ex.InnerException is PostgresException {SqlState: PostgresErrorCodes.UniqueViolation};
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