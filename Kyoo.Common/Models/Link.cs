using System;
using System.Linq.Expressions;

namespace Kyoo.Models
{
	public class Link
	{
		public int FirstID { get; set; }
		public int SecondID { get; set; }
		
		public Link() {}		
		
		public Link(IResource first, IResource second)
		{
			FirstID = first.ID;
			SecondID = second.ID;
		}

		public static Link Create(IResource first, IResource second)
		{
			return new(first, second);
		}
		
		public static Link<T, T2> Create<T, T2>(T first, T2 second)
			where T : class, IResource
			where T2 : class, IResource
		{
			return new(first, second);
		}
		
		public static Link<T, T2> UCreate<T, T2>(T first, T2 second)
			where T : class, IResource
			where T2 : class, IResource
		{
			return new(first, second, true);
		}
		
		public static Expression<Func<Link, object>> PrimaryKey
		{
			get
			{
				return x => new {LibraryID = x.FirstID, ProviderID = x.SecondID};
			}	
		}
	}
	
	public class Link<T1, T2> : Link
		where T1 : class, IResource
		where T2 : class, IResource
	{
		public virtual T1 First { get; set; }
		public virtual T2 Second { get; set; }
		
		
		public Link() {}
		
		public Link(T1 first, T2 second, bool privateItems = false)
			: base(first, second)
		{
			if (privateItems)
				return;
			First = first;
			Second = second;
		}

		public new static Expression<Func<Link<T1, T2>, object>> PrimaryKey
		{
			get
			{
				return x => new {LibraryID = x.FirstID, ProviderID = x.SecondID};
			}	
		}
	}
}