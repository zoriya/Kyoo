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
using Kyoo.Abstractions.Models;
using RabbitMQ.Client;

namespace Kyoo.RabbitMq;

public class RabbitProducer
{
	private readonly IModel _channel;

	public RabbitProducer(IConnection rabbitConnection)
	{
		_channel = rabbitConnection.CreateModel();

		_channel.ExchangeDeclare(exchange: "events.resource.collection", type: ExchangeType.Fanout);
		IRepository<Collection>.OnCreated += _Publish<Collection>("events.resource.collection", "created");
		IRepository<Collection>.OnEdited += _Publish<Collection>("events.resource.collection", "edited");
		IRepository<Collection>.OnDeleted += _Publish<Collection>("events.resource.collection", "deleted");

		_channel.ExchangeDeclare(exchange: "events.resource.movie", type: ExchangeType.Fanout);
		IRepository<Movie>.OnCreated += _Publish<Movie>("events.resource.movie", "created");
		IRepository<Movie>.OnEdited += _Publish<Movie>("events.resource.movie", "edited");
		IRepository<Movie>.OnDeleted += _Publish<Movie>("events.resource.movie", "deleted");

		_channel.ExchangeDeclare(exchange: "events.resource.show", type: ExchangeType.Fanout);
		IRepository<Show>.OnCreated += _Publish<Show>("events.resource.show", "created");
		IRepository<Show>.OnEdited += _Publish<Show>("events.resource.show", "edited");
		IRepository<Show>.OnDeleted += _Publish<Show>("events.resource.show", "deleted");

		_channel.ExchangeDeclare(exchange: "events.resource.season", type: ExchangeType.Fanout);
		IRepository<Season>.OnCreated += _Publish<Season>("events.resource.season", "created");
		IRepository<Season>.OnEdited += _Publish<Season>("events.resource.season", "edited");
		IRepository<Season>.OnDeleted += _Publish<Season>("events.resource.season", "deleted");

		_channel.ExchangeDeclare(exchange: "events.resource.episode", type: ExchangeType.Fanout);
		IRepository<Episode>.OnCreated += _Publish<Episode>("events.resource.episode", "created");
		IRepository<Episode>.OnEdited += _Publish<Episode>("events.resource.episode", "edited");
		IRepository<Episode>.OnDeleted += _Publish<Episode>("events.resource.episode", "deleted");

		_channel.ExchangeDeclare(exchange: "events.resource.studio", type: ExchangeType.Fanout);
		IRepository<Studio>.OnCreated += _Publish<Studio>("events.resource.studio", "created");
		IRepository<Studio>.OnEdited += _Publish<Studio>("events.resource.studio", "edited");
		IRepository<Studio>.OnDeleted += _Publish<Studio>("events.resource.studio", "deleted");

		_channel.ExchangeDeclare(exchange: "events.resource.user", type: ExchangeType.Fanout);
		IRepository<User>.OnCreated += _Publish<User>("events.resource.user", "created");
		IRepository<User>.OnEdited += _Publish<User>("events.resource.user", "edited");
		IRepository<User>.OnDeleted += _Publish<User>("events.resource.user", "deleted");
	}

	private IRepository<T>.ResourceEventHandler _Publish<T>(string exchange, string action)
		where T : IResource, IQuery
	{
		return (T resource) =>
		{
			var message = new
			{
				Action = action,
				Type = typeof(T).Name.ToLowerInvariant(),
				Value = resource,
			};
			_channel.BasicPublish(
				exchange,
				routingKey: string.Empty,
				body: Encoding.UTF8.GetBytes(JsonSerializer.Serialize(message))
			);
			return Task.CompletedTask;
		};
	}
}
