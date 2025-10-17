import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { LetterContext } from "../lib/claude";

interface ContextSpecificationsProps {
  onContextUpdate: (context: LetterContext) => void;
  initialContext?: LetterContext;
}

export function ContextSpecifications({ onContextUpdate, initialContext }: ContextSpecificationsProps) {
  const [context, setContext] = useState<LetterContext>(
    initialContext || {
      requirements: "Generate a comprehensive prior authorization letter for a medical procedure. The letter should be professional, concise, and clearly articulate the medical necessity.",
      payerRules: "Adhere strictly to standard payer policies for imaging and surgical procedures, emphasizing conservative treatment failure and objective findings.",
      clinicalGuidelines: "Reference relevant clinical guidelines for the diagnosis and procedure, ensuring all medical necessity criteria are met.",
      documentationStandards: "Ensure all documentation is complete, accurate, and includes patient demographics, diagnosis, procedure, treatment history, and clinical findings.",
      customInstructions: ""
    }
  );

  useEffect(() => {
    onContextUpdate(context);
  }, [context, onContextUpdate]);

  const handleReset = () => {
    const defaultContext: LetterContext = {
      requirements: "Generate a comprehensive prior authorization letter for a medical procedure. The letter should be professional, concise, and clearly articulate the medical necessity.",
      payerRules: "Adhere strictly to standard payer policies for imaging and surgical procedures, emphasizing conservative treatment failure and objective findings.",
      clinicalGuidelines: "Reference relevant clinical guidelines for the diagnosis and procedure, ensuring all medical necessity criteria are met.",
      documentationStandards: "Ensure all documentation is complete, accurate, and includes patient demographics, diagnosis, procedure, treatment history, and clinical findings.",
      customInstructions: ""
    };
    setContext(defaultContext);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Context Specifications for AI Letter Generation</CardTitle>
        <CardDescription>
          Define the guidelines and requirements for Claude when generating authorization letters.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="requirements" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="payerRules">Payer Rules</TabsTrigger>
            <TabsTrigger value="clinical">Clinical</TabsTrigger>
            <TabsTrigger value="standards">Standards</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>
          <TabsContent value="requirements" className="mt-4">
            <Textarea
              placeholder="Specify general requirements for the letter content and format."
              value={context.requirements}
              onChange={(e) => setContext({ ...context, requirements: e.target.value })}
              rows={5}
            />
          </TabsContent>
          <TabsContent value="payerRules" className="mt-4">
            <Textarea
              placeholder="Outline specific payer policies or criteria the letter must address."
              value={context.payerRules}
              onChange={(e) => setContext({ ...context, payerRules: e.target.value })}
              rows={5}
            />
          </TabsContent>
          <TabsContent value="clinical" className="mt-4">
            <Textarea
              placeholder="Provide clinical guidelines or medical necessity criteria to be emphasized."
              value={context.clinicalGuidelines}
              onChange={(e) => setContext({ ...context, clinicalGuidelines: e.target.value })}
              rows={5}
            />
          </TabsContent>
          <TabsContent value="standards" className="mt-4">
            <Textarea
              placeholder="Detail documentation standards or quality requirements for the letter."
              value={context.documentationStandards}
              onChange={(e) => setContext({ ...context, documentationStandards: e.target.value })}
              rows={5}
            />
          </TabsContent>
          <TabsContent value="custom" className="mt-4">
            <Textarea
              placeholder="Add any other specific instructions or details for Claude."
              value={context.customInstructions}
              onChange={(e) => setContext({ ...context, customInstructions: e.target.value })}
              rows={5}
            />
          </TabsContent>
        </Tabs>
        <Button variant="outline" onClick={handleReset} className="mt-4">
          Reset to Defaults
        </Button>
      </CardContent>
    </Card>
  );
}
