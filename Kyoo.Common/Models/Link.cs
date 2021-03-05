using System;
using System.Linq.Expressions;

namespace Kyoo.Models
{
	public class Link<T1, T2> 
		where T1 : class, IResource
		where T2 : class, IResource
	{
		public static Expression<Func<Link<T1, T2>, object>> PrimaryKey
		{
			get
			{
				return x => new {LibraryID = x.FirstID, ProviderID = x.SecondID};
			}	
		}
		
		public int FirstID { get; set; }
		public virtual T1 First { get; set; }
		public int SecondID { get; set; }
		public virtual T2 Second { get; set; }
	}
}