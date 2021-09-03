using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Database;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// A local repository for genres.
	/// </summary>
	public class GenreRepository : LocalRepository<Genre>, IGenreRepository
	{
		/// <summary>
		/// The database handle
		/// </summary>
		private readonly DatabaseContext _database;

		/// <inheritdoc />
		protected override Expression<Func<Genre, object>> DefaultSort => x => x.Slug;


		/// <summary>
		/// Create a new <see cref="GenreRepository"/>.
		/// </summary>
		/// <param name="database">The database handle</param>
		public GenreRepository(DatabaseContext database)
			: base(database)
		{
			_database = database;
		}

		/// <inheritdoc />
		public override async Task<ICollection<Genre>> Search(string query)
		{
			return await _database.Genres
				.Where(_database.Like<Genre>(x => x.Name, $"%{query}%"))
				.OrderBy(DefaultSort)
				.Take(20)
				.ToListAsync();
		}

		/// <inheritdoc />
		public override async Task<Genre> Create(Genre obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			await _database.SaveChangesAsync($"Trying to insert a duplicated genre (slug {obj.Slug} already exists).");
			return obj;
		}

		/// <inheritdoc />
		public override async Task Delete(Genre obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			_database.Entry(obj).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
		}
	}
}