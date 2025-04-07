import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Button } from "@repo/ui/components/button";
import { TauriThemeToggle } from "@repo/ui/components/tauri-theme-toggle";

export const AnalyzeTextView = () => {

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="flex justify-end mb-4">
        <TauriThemeToggle />
      </div>
      <Card>
      <CardHeader>
        <CardTitle>Форма входа</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Input placeholder="Email" type="email" />
          </div>
          <div>
            <Input placeholder="Пароль" type="password" />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="remember" />
            <label htmlFor="remember">Запомнить меня</label>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button>Войти</Button>
      </CardFooter>
    </Card>
    </div>
  );
};
