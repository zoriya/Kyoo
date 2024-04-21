using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kyoo.Postgresql.Migrations
{
	/// <inheritdoc />
	public partial class ReworkImages : Migration
	{
		private void MigrateImage(MigrationBuilder migrationBuilder, string table, string type)
		{
			migrationBuilder.Sql(
				$"""
					update {table} as r set {type} = json_build_object(
						'Id', gen_random_uuid(),
						'Source', r.{type}_source,
						'Blurhash', r.{type}_blurhash
					)
					where r.{type}_source is not null
				"""
			);
		}

		private void UnMigrateImage(MigrationBuilder migrationBuilder, string table, string type)
		{
			migrationBuilder.Sql(
				$"""
					update {table} as r
					set {type}_source = r.{type}->>'Source',
					    {type}_blurhash = r.{type}->>'Blurhash'
				"""
			);
		}

		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AddColumn<string>(
				name: "logo",
				table: "shows",
				type: "jsonb",
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "poster",
				table: "shows",
				type: "jsonb",
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "thumbnail",
				table: "shows",
				type: "jsonb",
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "logo",
				table: "seasons",
				type: "jsonb",
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "poster",
				table: "seasons",
				type: "jsonb",
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "thumbnail",
				table: "seasons",
				type: "jsonb",
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "logo",
				table: "movies",
				type: "jsonb",
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "poster",
				table: "movies",
				type: "jsonb",
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "thumbnail",
				table: "movies",
				type: "jsonb",
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "logo",
				table: "episodes",
				type: "jsonb",
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "poster",
				table: "episodes",
				type: "jsonb",
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "thumbnail",
				table: "episodes",
				type: "jsonb",
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "logo",
				table: "collections",
				type: "jsonb",
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "poster",
				table: "collections",
				type: "jsonb",
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "thumbnail",
				table: "collections",
				type: "jsonb",
				nullable: true
			);

			MigrateImage(migrationBuilder, "shows", "logo");
			MigrateImage(migrationBuilder, "shows", "poster");
			MigrateImage(migrationBuilder, "shows", "thumbnail");

			MigrateImage(migrationBuilder, "seasons", "logo");
			MigrateImage(migrationBuilder, "seasons", "poster");
			MigrateImage(migrationBuilder, "seasons", "thumbnail");

			MigrateImage(migrationBuilder, "movies", "logo");
			MigrateImage(migrationBuilder, "movies", "poster");
			MigrateImage(migrationBuilder, "movies", "thumbnail");

			MigrateImage(migrationBuilder, "episodes", "logo");
			MigrateImage(migrationBuilder, "episodes", "poster");
			MigrateImage(migrationBuilder, "episodes", "thumbnail");

			MigrateImage(migrationBuilder, "collections", "logo");
			MigrateImage(migrationBuilder, "collections", "poster");
			MigrateImage(migrationBuilder, "collections", "thumbnail");

			migrationBuilder.DropColumn(name: "logo_blurhash", table: "shows");
			migrationBuilder.DropColumn(name: "logo_source", table: "shows");
			migrationBuilder.DropColumn(name: "poster_blurhash", table: "shows");
			migrationBuilder.DropColumn(name: "poster_source", table: "shows");
			migrationBuilder.DropColumn(name: "thumbnail_blurhash", table: "shows");
			migrationBuilder.DropColumn(name: "thumbnail_source", table: "shows");

			migrationBuilder.DropColumn(name: "logo_blurhash", table: "seasons");
			migrationBuilder.DropColumn(name: "logo_source", table: "seasons");
			migrationBuilder.DropColumn(name: "poster_blurhash", table: "seasons");
			migrationBuilder.DropColumn(name: "poster_source", table: "seasons");
			migrationBuilder.DropColumn(name: "thumbnail_blurhash", table: "seasons");
			migrationBuilder.DropColumn(name: "thumbnail_source", table: "seasons");

			migrationBuilder.DropColumn(name: "logo_blurhash", table: "movies");
			migrationBuilder.DropColumn(name: "logo_source", table: "movies");
			migrationBuilder.DropColumn(name: "poster_blurhash", table: "movies");
			migrationBuilder.DropColumn(name: "poster_source", table: "movies");
			migrationBuilder.DropColumn(name: "thumbnail_blurhash", table: "movies");
			migrationBuilder.DropColumn(name: "thumbnail_source", table: "movies");

			migrationBuilder.DropColumn(name: "logo_blurhash", table: "episodes");
			migrationBuilder.DropColumn(name: "logo_source", table: "episodes");
			migrationBuilder.DropColumn(name: "poster_blurhash", table: "episodes");
			migrationBuilder.DropColumn(name: "poster_source", table: "episodes");
			migrationBuilder.DropColumn(name: "thumbnail_blurhash", table: "episodes");
			migrationBuilder.DropColumn(name: "thumbnail_source", table: "episodes");

			migrationBuilder.DropColumn(name: "logo_blurhash", table: "collections");
			migrationBuilder.DropColumn(name: "logo_source", table: "collections");
			migrationBuilder.DropColumn(name: "poster_blurhash", table: "collections");
			migrationBuilder.DropColumn(name: "poster_source", table: "collections");
			migrationBuilder.DropColumn(name: "thumbnail_blurhash", table: "collections");
			migrationBuilder.DropColumn(name: "thumbnail_source", table: "collections");
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AddColumn<string>(
				name: "logo_blurhash",
				table: "shows",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "logo_source",
				table: "shows",
				type: "text",
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "poster_blurhash",
				table: "shows",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "poster_source",
				table: "shows",
				type: "text",
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "thumbnail_blurhash",
				table: "shows",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "thumbnail_source",
				table: "shows",
				type: "text",
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "logo_blurhash",
				table: "seasons",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "logo_source",
				table: "seasons",
				type: "text",
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "poster_blurhash",
				table: "seasons",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "poster_source",
				table: "seasons",
				type: "text",
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "thumbnail_blurhash",
				table: "seasons",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "thumbnail_source",
				table: "seasons",
				type: "text",
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "logo_blurhash",
				table: "movies",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "logo_source",
				table: "movies",
				type: "text",
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "poster_blurhash",
				table: "movies",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "poster_source",
				table: "movies",
				type: "text",
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "thumbnail_blurhash",
				table: "movies",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "thumbnail_source",
				table: "movies",
				type: "text",
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "logo_blurhash",
				table: "episodes",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "logo_source",
				table: "episodes",
				type: "text",
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "poster_blurhash",
				table: "episodes",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "poster_source",
				table: "episodes",
				type: "text",
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "thumbnail_blurhash",
				table: "episodes",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "thumbnail_source",
				table: "episodes",
				type: "text",
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "logo_blurhash",
				table: "collections",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "logo_source",
				table: "collections",
				type: "text",
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "poster_blurhash",
				table: "collections",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "poster_source",
				table: "collections",
				type: "text",
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "thumbnail_blurhash",
				table: "collections",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "thumbnail_source",
				table: "collections",
				type: "text",
				nullable: true
			);

			UnMigrateImage(migrationBuilder, "shows", "logo");
			UnMigrateImage(migrationBuilder, "shows", "poster");
			UnMigrateImage(migrationBuilder, "shows", "thumbnail");

			UnMigrateImage(migrationBuilder, "seasons", "logo");
			UnMigrateImage(migrationBuilder, "seasons", "poster");
			UnMigrateImage(migrationBuilder, "seasons", "thumbnail");

			UnMigrateImage(migrationBuilder, "movies", "logo");
			UnMigrateImage(migrationBuilder, "movies", "poster");
			UnMigrateImage(migrationBuilder, "movies", "thumbnail");

			UnMigrateImage(migrationBuilder, "episodes", "logo");
			UnMigrateImage(migrationBuilder, "episodes", "poster");
			UnMigrateImage(migrationBuilder, "episodes", "thumbnail");

			UnMigrateImage(migrationBuilder, "collections", "logo");
			UnMigrateImage(migrationBuilder, "collections", "poster");
			UnMigrateImage(migrationBuilder, "collections", "thumbnail");

			migrationBuilder.DropColumn(name: "logo", table: "shows");
			migrationBuilder.DropColumn(name: "poster", table: "shows");
			migrationBuilder.DropColumn(name: "thumbnail", table: "shows");
			migrationBuilder.DropColumn(name: "logo", table: "seasons");
			migrationBuilder.DropColumn(name: "poster", table: "seasons");
			migrationBuilder.DropColumn(name: "thumbnail", table: "seasons");
			migrationBuilder.DropColumn(name: "logo", table: "movies");
			migrationBuilder.DropColumn(name: "poster", table: "movies");
			migrationBuilder.DropColumn(name: "thumbnail", table: "movies");
			migrationBuilder.DropColumn(name: "logo", table: "episodes");
			migrationBuilder.DropColumn(name: "poster", table: "episodes");
			migrationBuilder.DropColumn(name: "thumbnail", table: "episodes");
			migrationBuilder.DropColumn(name: "logo", table: "collections");
			migrationBuilder.DropColumn(name: "poster", table: "collections");
			migrationBuilder.DropColumn(name: "thumbnail", table: "collections");
		}
	}
}
