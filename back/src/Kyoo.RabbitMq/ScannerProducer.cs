// Kyoo - A portable and vast media library solution.
// Copyright (c) Kyoo.
//
// See AUTHORS.md and LICENSE file in the project root for full license information.
//
// Kyoo is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// Kyoo is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Kyoo. If not, see <https://www.gnu.org/licenses/>.

using System.Text;
using System.Text.Json;
using Kyoo.Abstractions.Controllers;
using Kyoo.Utils;
using RabbitMQ.Client;

namespace Kyoo.RabbitMq;

public class ScannerProducer : IScanner
{
	private readonly IModel _channel;

	public ScannerProducer(IConnection rabbitConnection)
	{
		_channel = rabbitConnection.CreateModel();
		if (!doesQueueExist(rabbitConnection, "scanner"))
			_channel.QueueDeclare("scanner", exclusive: false, autoDelete: false);
		if (!doesQueueExist(rabbitConnection, "scanner.rescan"))
			_channel.QueueDeclare("scanner.rescan", exclusive: false, autoDelete: false);
	}

	/// <summary>
	/// Checks if the queue exists. Needed to avoid crashing when re-declaring an existing
	/// queue with different parameters.
	/// </summary>
	/// <param name="rabbitConnection">The RabbitMQ connection.</param>
	/// <param name="queueName">The name of the channel.</param>
	/// <returns>True if the queue exists, false otherwise.</returns>
	private bool doesQueueExist(IConnection rabbitConnection, string queueName)
	{
		// If the queue does not exist when QueueDeclarePassive is called,
		// an exception will be thrown. According to the docs, when this
		// happens, the entire channel should be thrown away.
		using var channel = rabbitConnection.CreateModel();
		try
		{
			channel.QueueDeclarePassive(queueName);
			return true;
		}
		catch (Exception)
		{
			return false;
		}
	}

	private Task _Publish<T>(T message, string queue = "scanner")
	{
		var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(message, Utility.JsonOptions));
		_channel.BasicPublish("", routingKey: queue, body: body);
		return Task.CompletedTask;
	}

	public Task SendRescanRequest()
	{
		var message = new { Action = "rescan", };
		return _Publish(message, queue: "scanner.rescan");
	}

	public Task SendRefreshRequest(string kind, Guid id)
	{
		var message = new
		{
			Action = "refresh",
			Kind = kind.ToLowerInvariant(),
			Id = id
		};
		return _Publish(message);
	}
}
