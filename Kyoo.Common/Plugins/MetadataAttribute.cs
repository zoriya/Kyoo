using System;

namespace Kyoo.InternalAPI.MetadataProvider
{
    [AttributeUsage(AttributeTargets.Class)]
    public class MetaProvider : Attribute
    {
        public MetaProvider()  { }
    }
}
