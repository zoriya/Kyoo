using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using JetBrains.Annotations;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Exceptions;

namespace Kyoo.Abstractions.Controllers
{
	/// <summary>
	/// A single task parameter. This struct contains metadata to display and utility functions to get them in the task.
	/// </summary>
	/// <remarks>This struct will be used to generate the swagger documentation of the task.</remarks>
	public record TaskParameter
	{
		/// <summary>
		/// The name of this parameter.
		/// </summary>
		public string Name { get; init; }
		
		/// <summary>
		/// The description of this parameter.
		/// </summary>
		public string Description { get; init; }
		
		/// <summary>
		/// The type of this parameter.
		/// </summary>
		public Type Type { get; init; }
		
		/// <summary>
		/// Is this parameter required or can it be ignored?
		/// </summary>
		public bool IsRequired { get; init; }
		
		/// <summary>
		/// The default value of this object.
		/// </summary>
		public object DefaultValue { get; init; }

		/// <summary>
		/// The value of the parameter.
		/// </summary>
		private object Value { get; init; }
		
		/// <summary>
		/// Create a new task parameter.
		/// </summary>
		/// <param name="name">The name of the parameter</param>
		/// <param name="description">The description of the parameter</param>
		/// <typeparam name="T">The type of the parameter.</typeparam>
		/// <returns>A new task parameter.</returns>
		public static TaskParameter Create<T>(string name, string description)
		{
			return new TaskParameter
			{
				Name = name,
				Description = description,
				Type = typeof(T)
			};
		}
		
		/// <summary>
		/// Create a new required task parameter.
		/// </summary>
		/// <param name="name">The name of the parameter</param>
		/// <param name="description">The description of the parameter</param>
		/// <typeparam name="T">The type of the parameter.</typeparam>
		/// <returns>A new task parameter.</returns>
		public static TaskParameter CreateRequired<T>(string name, string description)
		{
			return new TaskParameter
			{
				Name = name,
				Description = description,
				Type = typeof(T),
				IsRequired = true
			};
		}
		
		/// <summary>
		/// Create a parameter's value to give to a task.
		/// </summary>
		/// <param name="name">The name of the parameter</param>
		/// <param name="value">The value of the parameter. It's type will be used as parameter's type.</param>
		/// <typeparam name="T">The type of the parameter</typeparam>
		/// <returns>A TaskParameter that can be used as value.</returns>
		public static TaskParameter CreateValue<T>(string name, T value)
		{
			return new()
			{
				Name = name,
				Type = typeof(T),
				Value = value
			};
		}

		/// <summary>
		/// Create a parameter's value for the current parameter.
		/// </summary>
		/// <param name="value">The value to use</param>
		/// <returns>A new parameter's value for this current parameter</returns>
		public TaskParameter CreateValue(object value)
		{
			return this with {Value = value};
		}
		
		/// <summary>
		/// Get the value of this parameter. If the value is of the wrong type, it will be converted.
		/// </summary>
		/// <typeparam name="T">The type of this parameter</typeparam>
		/// <returns>The value of this parameter.</returns>
		public T As<T>()
		{
			if (typeof(T) == typeof(object))
				return (T)Value;

			if (Value is IResource resource)
			{
				if (typeof(T) == typeof(string))
					return (T)(object)resource.Slug;
				if (typeof(T) == typeof(int))
					return (T)(object)resource.ID;
			}

			return (T)Convert.ChangeType(Value, typeof(T));
		}
	}

	/// <summary>
	/// A parameters container implementing an indexer to allow simple usage of parameters.
	/// </summary>
	public class TaskParameters : List<TaskParameter>
	{
		/// <summary>
		/// An indexer that return the parameter with the specified name.
		/// </summary>
		/// <param name="name">The name of the task (case sensitive)</param>
		public TaskParameter this[string name] => this.FirstOrDefault(x => x.Name == name);

		
		/// <summary>
		/// Create a new, empty, <see cref="TaskParameters"/>
		/// </summary>
		public TaskParameters() {}
		
		/// <summary>
		/// Create a <see cref="TaskParameters"/> with an initial parameters content 
		/// </summary>
		/// <param name="parameters">The list of parameters</param>
		public TaskParameters(IEnumerable<TaskParameter> parameters)
		{
			AddRange(parameters);
		}
	}
	
	/// <summary>
	/// A common interface that tasks should implement.
	/// </summary>
	public interface ITask
	{
		/// <summary>
		/// The list of parameters
		/// </summary>
		/// <returns>
		/// All parameters that this task as. Every one of them will be given to the run function with a value.
		/// </returns>
		public TaskParameters GetParameters();
		
		/// <summary>
		/// Start this task.
		/// </summary>
		/// <param name="arguments">
		/// The list of parameters.
		/// </param>
		/// <param name="progress">
		/// The progress reporter. Used to inform the sender the percentage of completion of this task
		/// .</param>
		/// <param name="cancellationToken">A token to request the task's cancellation.
		/// If this task is not cancelled quickly, it might be killed by the runner.
		/// </param>
		/// <exception cref="TaskFailedException">
		/// An exception meaning that the task has failed for handled reasons like invalid arguments,
		/// invalid environment, missing plugins or failures not related to a default in the code.
		/// This exception allow the task to display a failure message to the end user while others exceptions
		/// will be displayed as unhandled exceptions and display a stack trace.
		/// </exception>
		public Task Run([NotNull] TaskParameters arguments,
			[NotNull] IProgress<float> progress,
			CancellationToken cancellationToken);
	}
}