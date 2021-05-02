using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Models;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	/// <summary>
	/// A local repository to handle studios
	/// </summary>
	public class StudioRepository : LocalRepository<Studio>, IStudioRepository
	{
		/// <summary>
		/// The database handle
		/// </summary>
		private readonly DatabaseContext _database;
		
		/// <inheritdoc />
		protected override Expression<Func<Studio, object>> DefaultSort => x => x.Name;


		/// <summary>
		/// Create a new <see cref="StudioRepository"/>.
		/// </summary>
		/// <param name="database">The database handle</param>
		public StudioRepository(DatabaseContext database)
			: base(database)
		{
			_database = database;
		}
		
		/// <inheritdoc />
		public override async Task<ICollection<Studio>> Search(string query)
		{
			return await _database.Studios
				.Where(_database.Like<Studio>(x => x.Name, $"%{query}%"))
				.OrderBy(DefaultSort)
				.Take(20)
				.ToListAsync();
		}

		/// <inheritdoc />
		public override async Task<Studio> Create(Studio obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			await _database.SaveChangesAsync($"Trying to insert a duplicated studio (slug {obj.Slug} already exists).");
			return obj;
		}

		/// <inheritdoc />
		public override async Task Delete(Studio obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Entry(obj).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
		}
	}
}