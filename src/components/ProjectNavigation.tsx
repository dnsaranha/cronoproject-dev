import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { Users } from "lucide-react"

const ProjectNavigation = () => {
  const projectId = "your-project-id"
  const pathname = window.location.pathname

  return (
    <Button 
      variant={pathname.includes('/members') || pathname.includes('/equipe') ? 'default' : 'ghost'} 
      className="justify-start" 
      asChild
    >
      <Link to={`/project/${projectId}/members`}>
        <Users className="h-4 w-4 mr-2" />
        Equipe
      </Link>
    </Button>
  )
}

export default ProjectNavigation 