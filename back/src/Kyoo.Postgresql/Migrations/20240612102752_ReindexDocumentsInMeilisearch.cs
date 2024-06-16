using System.Linq;
using Kyoo.Meiliseach;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kyoo.Postgresql.Migrations
{
	/// <inheritdoc />
	public partial class ReindexDocumentsInMeilisearch : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			var meilisearchClient = MeilisearchModule.CreateMeilisearchClient();
			var meiliSync = new MeiliSync(meilisearchClient);

			//TODO...
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
		}
	}
}
