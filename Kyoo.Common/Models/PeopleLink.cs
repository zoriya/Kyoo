namespace Kyoo.Models
{
    public class PeopleLink
    {
        public long ID { get; set; }
        public long PeopleID { get; set; }
        public People People { get; set; }
        public long ShowID { get; set; }
        public Show Show { get; set; }
        public string Role { get; set; }
        public string Type { get; set; }
    }
}