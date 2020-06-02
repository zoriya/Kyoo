using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace Kyoo.Controllers
{
	public class LibraryManager : ILibraryManager
	{
		private readonly ILibraryRepository _library;
		
		public LibraryManager(ILibraryRepository library)
		{
			_library = library;
		}

		public Library Get(string slug)
		{
			throw new NotImplementedException();
		}

		public IEnumerable<Library> Search(string query)
		{
			throw new NotImplementedException();
		}

		public IEnumerable<Library> GetAll()
		{
			throw new NotImplementedException();
		}

		public Library Create(Library obj)
		{
			throw new NotImplementedException();
		}

		public Library CreateIfNotExists(Library obj)
		{
			throw new NotImplementedException();
		}

		public void Edit(Library edited, bool resetOld)
		{
			throw new NotImplementedException();
		}

		public void Delete(string slug)
		{
			throw new NotImplementedException();
		}
	}
}
