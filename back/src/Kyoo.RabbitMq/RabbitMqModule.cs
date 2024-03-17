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

using Autofac;
using Kyoo.Abstractions.Controllers;
using Microsoft.Extensions.Configuration;
using RabbitMQ.Client;

namespace Kyoo.RabbitMq;

public class RabbitMqModule(IConfiguration configuration) : IPlugin
{
	/// <inheritdoc />
	public string Name => "RabbitMq";

	/// <inheritdoc />
	public void Configure(ContainerBuilder builder)
	{
		builder
			.Register(
				(_) =>
				{
					ConnectionFactory factory =
						new()
						{
							UserName = configuration.GetValue("RABBITMQ_DEFAULT_USER", "guest"),
							Password = configuration.GetValue("RABBITMQ_DEFAULT_USER", "guest"),
							HostName = configuration.GetValue("RABBITMQ_HOST", "rabbitmq:5672"),
						};

					return factory.CreateConnection();
				}
			)
			.AsSelf()
			.SingleInstance();
		builder.RegisterType<RabbitProducer>().AsSelf().SingleInstance().AutoActivate();
	}
}
