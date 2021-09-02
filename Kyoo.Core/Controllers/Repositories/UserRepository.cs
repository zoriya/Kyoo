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
	/// A repository for users.
	/// </summary>
	public class UserRepository : LocalRepository<User>, IUserRepository
	{
		/// <summary>
		/// The database handle
		/// </summary>
		private readonly DatabaseContext _database;
		
		/// <inheritdoc />
		protected override Expression<Func<User, object>> DefaultSort => x => x.Username;
		
		
		/// <summary>
		/// Create a new <see cref="UserRepository"/>
		/// </summary>
		/// <param name="database">The database handle to use</param>
		public UserRepository(DatabaseContext database)
			: base(database)
		{
			_database = database;
		}
		
		/// <inheritdoc />
		public override async Task<ICollection<User>> Search(string query)
		{
			return await _database.Users
				.Where(_database.Like<User>(x => x.Username, $"%{query}%"))
				.OrderBy(DefaultSort)
				.Take(20)
				.ToListAsync();
		}
		
		/// <inheritdoc />
		public override async Task<User> Create(User obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			await _database.SaveChangesAsync($"Trying to insert a duplicated user (slug {obj.Slug} already exists).");
			return obj;
		}

		/// <inheritdoc />
		public override async Task Delete(User obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Entry(obj).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
		}
	}
}