using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	public class StudioRepository : LocalRepository<Studio>, IStudioRepository
	{
		private readonly DatabaseContext _database;
		protected override Expression<Func<Studio, object>> DefaultSort => x => x.Name;


		public StudioRepository(DatabaseContext database) : base(database)
		{
			_database = database;
		}
		
		public override async Task<ICollection<Studio>> Search(string query)
		{
			return await _database.Studios
				.Where(x => EF.Functions.ILike(x.Name, $"%{query}%"))
				.Take(20)
				.ToListAsync();
		}

		public override async Task<Studio> Create(Studio obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			_database.Entry(obj).State = EntityState.Added;
			
			try
			{
				await _database.SaveChangesAsync();
			}
			catch (DbUpdateException ex)
			{
				_database.DiscardChanges();
				if (IsDuplicateException(ex))
					throw new DuplicatedItemException($"Trying to insert a duplicated studio (slug {obj.Slug} already exists).");
				throw;
			}
			return obj;
		}

		protected override Task Validate(Studio ressource)
		{
			return Task.CompletedTask;
		}
		
		public override async Task Delete(Studio obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Entry(obj).State = EntityState.Deleted;
			
			// Using Dotnet-EF change discovery service to remove references to this studio on shows.
			foreach (Show show in obj.Shows)
				show.StudioID = null;
			await _database.SaveChangesAsync();
		}
	}
}