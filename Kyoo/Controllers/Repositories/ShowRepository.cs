using System;
using System.Collections.Generic;
using System.Linq;
using Kyoo.Models;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	public class ShowRepository : IShowRepository
	{
		private readonly DatabaseContext _database;
		private readonly ILibraryManager _library;

		public ShowRepository(DatabaseContext database, ILibraryManager library)
		{
			_database = database;
			_library = library;
		}
		
		public Show Get(string slug)
		{
			return _database.Shows.FirstOrDefault(x => x.Slug == slug);
		}

		public IEnumerable<Show> Search(string query)
		{
			return _database.Shows.FromSqlInterpolated($@"SELECT * FROM Shows WHERE Shows.Title LIKE {$"%{query}%"}
			                                           OR Shows.Aliases LIKE {$"%{query}%"}").Take(20);
		}

		public IEnumerable<Show> GetAll()
		{
			return _database.Shows.ToList();
		}

		public Show Create(Show obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			obj.Genres = obj.Genres.Select(_library.CreateIfNotExists).ToList();
			
			
			_database.Shows.Add(obj);
			_database.SaveChanges();
			return obj;
		}
		
		public Show CreateIfNotExists(Show obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			return Get(obj.Slug) ?? Create(obj);
		}

		public void Edit(Show edited, bool resetOld)
		{
			throw new System.NotImplementedException();
		}

		public void Delete(string slug)
		{
			throw new System.NotImplementedException();
		}
	}
}