using System;

namespace Kyoo.Models.Exceptions
{
	public class DuplicatedItemException : Exception
	{
		public override string Message { get; }

		public DuplicatedItemException()
		{
			Message = "Already exists in the databse.";
		}
		
		public DuplicatedItemException(string message)
		{
			Message = message;
		}
	}
}